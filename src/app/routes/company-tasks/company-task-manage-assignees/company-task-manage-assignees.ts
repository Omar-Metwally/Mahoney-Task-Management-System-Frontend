import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import {
  CompanyTaskService,
  PaginatedCompanyTaskDto,
} from '../company-tasks.service';
import { DepartmentService } from '../../departments/departments.service';
import { EmployeeListDto } from '../../employees/employees.service';

// ─── Assignee response shape ──────────────────────────────────────────────────

export interface GetCompanyTaskAssigneeResponse {
  id: number;
  fullName: string;
  email: string;
}

export interface CompanyTaskManageAssigneesData {
  task: PaginatedCompanyTaskDto;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-company-task-manage-assignees',
  templateUrl: './company-task-manage-assignees.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
  ],
})
export class CompanyTaskManageAssignees implements OnInit {
  private readonly dialogRef   = inject(MatDialogRef<CompanyTaskManageAssignees>);
  private readonly data        = inject<CompanyTaskManageAssigneesData>(MAT_DIALOG_DATA);
  private readonly taskService = inject(CompanyTaskService);
  private readonly departmentService  = inject(DepartmentService);

  readonly task = this.data.task;

  // ── State ──────────────────────────────────────────────────────────────────

  isLoadingAssignees  = signal(false);
  isLoadingEmployees  = signal(false);
  togglingEmployeeId  = signal<number | null>(null); // tracks which row is mid-request

  assignees  = signal<GetCompanyTaskAssigneeResponse[]>([]);
  employees  = signal<EmployeeListDto[]>([]);           // from department
  searchTerm = signal('');

  /** true if any mutation happened — tells the table to reload on close */
  private dirty = false;

  // ── Derived ────────────────────────────────────────────────────────────────

  assigneeIds = computed(() => new Set(this.assignees().map(a => a.id)));

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees().filter(e =>
      !term || e.fullName.toLowerCase().includes(term)
    );
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAssignees();
    this.loadDepartmentEmployees();
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  private loadAssignees(): void {
    this.isLoadingAssignees.set(true);
    this.taskService.getAssignees(this.task.id).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.assignees.set(result.result);
        }
        this.isLoadingAssignees.set(false);
      },
      error: () => this.isLoadingAssignees.set(false),
    });
  }

  private loadDepartmentEmployees(): void {
    if (!this.task.departmentId) return;
    this.isLoadingEmployees.set(true);
    this.departmentService.getDepartmentEmployees(this.task.departmentId).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.employees.set(result.result);
        }
        this.isLoadingEmployees.set(false);
      },
      error: () => this.isLoadingEmployees.set(false),
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  toggle(employee: EmployeeListDto): void {
    if (this.togglingEmployeeId() !== null) return; // block concurrent toggles

    const isAssigned = this.assigneeIds().has(employee.id);
    this.togglingEmployeeId.set(employee.id);

    const request$ = isAssigned
      ? this.taskService.unassignEmployee(this.task.id, employee.id)
      : this.taskService.assignEmployee(this.task.id, { employeeId: employee.id });

    request$.subscribe({
      next: result => {
        if (result.isSuccess) {
          this.dirty = true;
          // optimistically update the assignees list
          if (isAssigned) {
            this.assignees.update(list => list.filter(a => a.id !== employee.id));
          } else {
            this.assignees.update(list => [...list, { id: employee.id, fullName: employee.fullName, email: '' }]);
          }
        }
        this.togglingEmployeeId.set(null);
      },
      error: () => this.togglingEmployeeId.set(null),
    });
  }

  onClose(): void {
    this.dialogRef.close(this.dirty);
  }
}
