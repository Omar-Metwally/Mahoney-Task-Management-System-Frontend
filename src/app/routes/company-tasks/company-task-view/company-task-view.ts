import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NgxPermissionsModule } from 'ngx-permissions';

import {
  CompanyTaskService,
  CompanyTaskDetailDto,
  CompanyTaskMilestoneDto,
  MilestoneStatus,
  TASK_IMPORTANCE_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../company-tasks.service';
import { TaskHubService } from '@core';
import { Subject, takeUntil, filter } from 'rxjs';

export interface CompanyTaskViewDialogData {
  taskId: number;
}

// ── Milestone status options ───────────────────────────────────────────────────

const MILESTONE_STATUS_OPTIONS = [
  { label: 'Pending', value: MilestoneStatus.Pending },
  { label: 'In Progress', value: MilestoneStatus.InProgress },
  { label: 'Completed', value: MilestoneStatus.Completed },
];

@Component({
  selector: 'app-company-task-view',
  templateUrl: './company-task-view.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatDialogModule,
    NgxPermissionsModule,
  ],
})
export class CompanyTaskView implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<CompanyTaskView>);
  private readonly data = inject<CompanyTaskViewDialogData>(MAT_DIALOG_DATA);
  private readonly taskService = inject(CompanyTaskService);
  private readonly taskHub = inject(TaskHubService);
  private readonly destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────────────

  isLoading = signal(true);
  task = signal<CompanyTaskDetailDto | null>(null);
  savingMilestone = signal(false);
  deletingId = signal<number | null>(null);
  changingStatusId = signal<number | null>(null);

  /** null = form closed, -1 = adding new, N = editing milestone with id N */
  activeFormId = signal<number | null>(null);

  readonly importanceOptions = TASK_IMPORTANCE_OPTIONS;
  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly milestoneStatusOptions = MILESTONE_STATUS_OPTIONS;

  // ── Milestone form ────────────────────────────────────────────────────────

  milestoneForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required, Validators.maxLength(200)]),
    description: new FormControl<string>('', [Validators.required, Validators.maxLength(2000)]),
    dueTime: new FormControl<string | null>(null),
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  isAddingNew = computed(() => this.activeFormId() === -1);

  importanceLabel = computed(
    () => this.importanceOptions.find(o => o.value === this.task()?.importance)?.label ?? ''
  );

  statusLabel = computed(
    () => this.statusOptions.find(o => o.value === this.task()?.status)?.label ?? ''
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadTask();

    const myTaskId = this.data.taskId;

    // Reload whole task if its core fields change
    this.taskHub.taskUpdated$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(() => this.loadTask());

    this.taskHub.taskStatusChanged$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(() => this.loadTask());

    // Patch milestones in-place to avoid full reload flicker
    this.taskHub.milestoneAdded$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(() => this.loadTask());

    this.taskHub.milestoneUpdated$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(() => this.loadTask());

    this.taskHub.milestoneDeleted$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(p =>
        this.task.update(t =>
          t ? { ...t, milestones: t.milestones.filter(m => m.id !== p.milestoneId) } : t
        )
      );

    this.taskHub.milestoneCompleted$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(p =>
        this.task.update(t =>
          t
            ? {
                ...t,
                milestones: t.milestones.map(m =>
                  m.id === p.milestoneId ? { ...m, isCompleted: true, status: 2 } : m
                ),
              }
            : t
        )
      );

    this.taskHub.milestoneStatusChanged$
      .pipe(
        takeUntil(this.destroy$),
        filter(p => p.taskId === myTaskId)
      )
      .subscribe(p =>
        this.task.update(t =>
          t
            ? {
                ...t,
                milestones: t.milestones.map(m =>
                  m.id === p.milestoneId
                    ? { ...m, status: p.newStatus as any, isCompleted: p.newStatus === 'Completed' }
                    : m
                ),
              }
            : t
        )
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTask(): void {
    this.isLoading.set(true);
    this.taskService.getTaskDetail(this.data.taskId).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.task.set(result.result);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // ── Milestone form helpers ────────────────────────────────────────────────

  openAddForm(): void {
    this.milestoneForm.reset();
    this.activeFormId.set(-1);
  }

  openEditForm(milestone: CompanyTaskMilestoneDto): void {
    this.milestoneForm.patchValue({
      title: String(milestone.title),
      description: milestone.description,
      dueTime: milestone.dueTime,
    });
    this.activeFormId.set(milestone.id);
  }

  closeForm(): void {
    this.activeFormId.set(null);
    this.milestoneForm.reset();
  }

  // ── Milestone CRUD ────────────────────────────────────────────────────────

  onSaveMilestone(): void {
    if (this.milestoneForm.invalid || this.savingMilestone()) return;
    this.savingMilestone.set(true);

    const { title, description, dueTime } = this.milestoneForm.getRawValue();
    const taskId = this.data.taskId;
    const formId = this.activeFormId();

    const request$ =
      formId === -1
        ? this.taskService.addMilestone(taskId, {
            title: title!,
            description: description!,
            dueTime: dueTime ?? null,
          })
        : this.taskService.editMilestone(taskId, formId!, {
            title: title ?? undefined,
            description: description ?? undefined,
            dueTime: dueTime ?? undefined,
          });

    request$.subscribe({
      next: result => {
        if (result.isSuccess) {
          this.closeForm();
          this.loadTask(); // reload to get updated milestones
        }
        this.savingMilestone.set(false);
      },
      error: () => this.savingMilestone.set(false),
    });
  }

  onDeleteMilestone(milestone: CompanyTaskMilestoneDto): void {
    if (this.deletingId() !== null) return;
    this.deletingId.set(milestone.id);

    this.taskService.deleteMilestone(this.data.taskId, milestone.id).subscribe({
      next: result => {
        if (result.isSuccess) {
          this.task.update(t =>
            t ? { ...t, milestones: t.milestones.filter(m => m.id !== milestone.id) } : t
          );
        }
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  onChangeMilestoneStatus(milestone: CompanyTaskMilestoneDto, status: MilestoneStatus): void {
    if (this.changingStatusId() !== null) return;
    this.changingStatusId.set(milestone.id);

    this.taskService.changeMilestoneStatus(this.data.taskId, milestone.id, status).subscribe({
      next: result => {
        if (result.isSuccess) {
          this.task.update(t =>
            t
              ? {
                  ...t,
                  milestones: t.milestones.map(m =>
                    m.id === milestone.id
                      ? { ...m, status, isCompleted: status === MilestoneStatus.Completed }
                      : m
                  ),
                }
              : t
          );
        }
        this.changingStatusId.set(null);
      },
      error: () => this.changingStatusId.set(null),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  milestoneStatusLabel(status: MilestoneStatus): string {
    return this.milestoneStatusOptions.find(o => o.value === status)?.label ?? '';
  }

  milestoneIcon(milestone: CompanyTaskMilestoneDto): string {
    if (milestone.isCompleted) return 'check_circle';
    if (milestone.status === MilestoneStatus.InProgress) return 'pending';
    return 'radio_button_unchecked';
  }

  milestoneIconColor(milestone: CompanyTaskMilestoneDto): string {
    if (milestone.isCompleted) return 'var(--mat-sys-primary)';
    if (milestone.status === MilestoneStatus.InProgress) return 'var(--mat-sys-tertiary)';
    return 'var(--mat-sys-on-surface-variant)';
  }

  // ── Error getters ─────────────────────────────────────────────────────────

  get titleError(): string {
    const c = this.milestoneForm.get('title')!;
    if (c.hasError('required')) return 'Title is required.';
    if (c.hasError('maxlength')) return 'Title cannot exceed 200 characters.';
    return '';
  }

  get descriptionError(): string {
    const c = this.milestoneForm.get('description')!;
    if (c.hasError('required')) return 'Description is required.';
    if (c.hasError('maxlength')) return 'Description cannot exceed 2000 characters.';
    return '';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
