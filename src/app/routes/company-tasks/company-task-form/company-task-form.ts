import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import {
  CompanyTaskService,
  PaginatedCompanyTaskDto,
  TaskImportance,
  TASK_IMPORTANCE_OPTIONS,
} from '../company-tasks.service';
import { DepartmentService } from '../../departments/departments.service';
import { AuthService } from '@core/authentication';

export interface CompanyTaskFormDialogData {
  task?: PaginatedCompanyTaskDto | null;
}

@Component({
  selector: 'app-company-task-form',
  templateUrl: './company-task-form.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class CompanyTaskForm implements OnInit {
  private readonly dialogRef         = inject(MatDialogRef<CompanyTaskForm>);
  private readonly data              = inject<CompanyTaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly taskService       = inject(CompanyTaskService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService       = inject(AuthService);

  isEdit    = !!this.data?.task;
  isSaving  = false;
  isLoadingDepartments = false;
  isAdmin   = false;

  departments: { id: number; name: string }[] = [];
  readonly importanceOptions = TASK_IMPORTANCE_OPTIONS;

  form = new FormGroup({
    title: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(200),
    ]),
    description: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(2000),
    ]),
    importance: new FormControl<TaskImportance | null>(null, [
      Validators.required,
    ]),
    departmentId: new FormControl<number | null>(null),
    dueTime:      new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    this.authService.user().subscribe(user => {
      this.isAdmin = user?.CompanyRole === 'Admin';
      if (this.isAdmin && !this.isEdit) this.loadDepartments();
    });

    if (this.isEdit && this.data.task) {
      this.form.patchValue({
        title:       this.data.task.title,
        description: this.data.task.description,
        importance:  this.data.task.importance,
        dueTime:     this.data.task.dueTime,
      });
      // departmentId cannot be changed after creation
      this.form.get('departmentId')!.disable();
    }
  }

  private loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.departmentService.getPaginated({ pageNumber: 1, pageSize: 100 }, {}).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.departments = result.result.data.map(d => ({ id: d.id, name: d.name }));
        }
        this.isLoadingDepartments = false;
      },
      error: () => { this.isLoadingDepartments = false; },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const { title, description, importance, departmentId, dueTime } = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.taskService.edit(this.data.task!.id, {
          title:       title       ?? undefined,
          description: description ?? undefined,
          importance:  importance  ?? undefined,
          dueTime:     dueTime     ?? undefined,
        })
      : this.taskService.add({
          title:        title!,
          description:  description!,
          importance:   importance!,
          departmentId: departmentId,
          dueTime:      dueTime,
        });

    request$.subscribe({
      next: result => {
        if (result.isSuccess) this.dialogRef.close(true);
        this.isSaving = false;
      },
      error: () => { this.isSaving = false; },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get dialogTitle(): string {
    return this.isEdit ? 'Edit Task' : 'New Task';
  }

  get titleError(): string {
    const c = this.form.get('title')!;
    if (c.hasError('required'))  return 'Title is required.';
    if (c.hasError('maxlength')) return 'Title cannot exceed 200 characters.';
    return '';
  }

  get descriptionError(): string {
    const c = this.form.get('description')!;
    if (c.hasError('required'))  return 'Description is required.';
    if (c.hasError('maxlength')) return 'Description cannot exceed 2000 characters.';
    return '';
  }

  get importanceError(): string {
    return this.form.get('importance')!.hasError('required') ? 'Importance is required.' : '';
  }
}
