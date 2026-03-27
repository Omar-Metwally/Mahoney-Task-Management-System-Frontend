import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import {
  CompanyTaskService,
  PaginatedCompanyTaskDto,
  TaskStatus,
  TASK_STATUS_OPTIONS,
} from '../company-tasks.service';

export interface CompanyTaskChangeStatusDialogData {
  task: PaginatedCompanyTaskDto;
}

@Component({
  selector: 'app-company-task-change-status',
  templateUrl: './company-task-change-status.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class CompanyTaskChangeStatus {
  private readonly dialogRef   = inject(MatDialogRef<CompanyTaskChangeStatus>);
  private readonly data        = inject<CompanyTaskChangeStatusDialogData>(MAT_DIALOG_DATA);
  private readonly taskService = inject(CompanyTaskService);

  isSaving = signal(false);

  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly task          = this.data.task;

  statusControl = new FormControl<TaskStatus | null>(
    this.data.task.status,
    [Validators.required]
  );

  onSubmit(): void {
    if (this.statusControl.invalid || this.isSaving()) return;

    // no-op if status hasn't changed
    if (this.statusControl.value === this.task.status) {
      this.dialogRef.close(false);
      return;
    }

    this.isSaving.set(true);

    this.taskService.changeStatus(this.task.id, { newStatus: this.statusControl.value! }).subscribe({
      next: result => {
        if (result.isSuccess) this.dialogRef.close(true);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get currentStatusLabel(): string {
    return this.statusOptions.find(o => o.value === this.task.status)?.label ?? '';
  }
}
