import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';

import {
  GenericTableComponent,
  TableActionButton,
  TablePageEvent,
  TableSortEvent,
} from '@shared/components/generic-table/generic-table';
import { PaginationParameters } from '@shared/services/base-api.service';
import {
  CompanyTaskService,
  PaginatedCompanyTaskDto,
  CompanyTaskFilters,
  TaskImportance,
  TaskStatus,
  TASK_IMPORTANCE_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../company-tasks.service';
import { AuthService } from '@core/authentication';
import { DepartmentService } from '../../departments/departments.service';
import { CompanyTaskForm } from '../company-task-form/company-task-form';
import { CompanyTaskView } from '../company-task-view/company-task-view';
import { CompanyTaskChangeStatus } from '../company-task-change-status/company-task-change-status';
import { CompanyTaskManageAssignees } from '../company-task-manage-assignees/company-task-manage-assignees';
import { PageHeader } from '@shared';
import { TaskHubService } from '@core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-company-tasks-table',
  templateUrl: './company-tasks-table.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    NgxPermissionsModule,
    GenericTableComponent,
    PageHeader,
  ],
})
export class CompanyTasksTable implements OnInit {
  private readonly taskService = inject(CompanyTaskService);
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly permissionsService = inject(NgxPermissionsService);
  private readonly taskHub = inject(TaskHubService);
  private readonly destroy$ = new Subject<void>();

  // ── Table state ───────────────────────────────────────────────────────────

  data = signal<PaginatedCompanyTaskDto[]>([]);
  totalCount = signal(0);
  pageIndex = signal(0);
  isLoading = signal(false);
  pageSize = 10;

  private params: PaginationParameters = { pageNumber: 1, pageSize: 10 };
  private filterValues: CompanyTaskFilters = {};

  // ── Role ──────────────────────────────────────────────────────────────────

  isAdmin = false;
  departments: { id: number; name: string }[] = [];

  // ── Filter state ──────────────────────────────────────────────────────────

  filters: CompanyTaskFilters = {
    importance: null,
    status: null,
    departmentId: null,
  };

  readonly importanceOptions = TASK_IMPORTANCE_OPTIONS;
  readonly statusOptions = TASK_STATUS_OPTIONS;

  // ── Columns ───────────────────────────────────────────────────────────────

  columns: MtxGridColumn[] = [
    { header: 'Title', field: 'title', minWidth: 180, sortable: true },
    {
      header: 'Importance',
      field: 'importance',
      minWidth: 110,
      sortable: true,
      formatter: (row: PaginatedCompanyTaskDto) =>
        TASK_IMPORTANCE_OPTIONS.find(o => o.value === row.importance)?.label ?? '',
    },
    {
      header: 'Status',
      field: 'status',
      minWidth: 110,
      sortable: true,
      formatter: (row: PaginatedCompanyTaskDto) =>
        TASK_STATUS_OPTIONS.find(o => o.value === row.status)?.label ?? '',
    },
    { header: 'Department', field: 'departmentName', minWidth: 140 },
    { header: 'Assignees', field: 'assigneesCount', minWidth: 90, sortable: true },
    {
      header: 'Due',
      field: 'dueTime',
      minWidth: 130,
      sortable: true,
      formatter: (row: PaginatedCompanyTaskDto) =>
        row.dueTime ? new Date(row.dueTime).toLocaleDateString() : '—',
    },
  ];

  // ── Extra actions ─────────────────────────────────────────────────────────

  extraActions: TableActionButton<PaginatedCompanyTaskDto>[] = [
    {
      icon: 'swap_horiz',
      tooltip: 'Change Status',
      click: row => this.onChangeStatus(row),
      show: this.can('task:edit'),
    },
    {
      icon: 'group',
      tooltip: 'Manage Assignees',
      click: row => this.onManageAssignees(row),
      show: this.can('task:edit'),
    },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.authService.user().subscribe(user => {
      this.isAdmin = user?.CompanyRole === 'Admin';
      if (this.isAdmin) this.loadDepartments();
    });
    this.load();
    this.taskHub.taskCreated$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.taskHub.taskUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.taskHub.taskDeleted$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.taskHub.taskStatusChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.taskHub.employeeAssigned$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.taskHub.employeeUnassigned$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  load(): void {
    this.isLoading.set(true);
    this.taskService.getPaginated(this.params, this.filterValues).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.data.set(result.result.data);
          this.totalCount.set(result.result.totalCount);
          this.pageIndex.set(result.result.pageNumber - 1);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadDepartments(): void {
    this.departmentService.getPaginated({ pageNumber: 1, pageSize: 100 }, {}).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.departments = result.result.data.map(d => ({ id: d.id, name: d.name }));
        }
      },
    });
  }

  // ── Table events ──────────────────────────────────────────────────────────

  onPageChange(event: TablePageEvent): void {
    this.params = { ...this.params, pageNumber: event.pageIndex + 1, pageSize: event.pageSize };
    this.pageSize = event.pageSize;
    this.load();
  }

  onSortChange(event: TableSortEvent): void {
    this.params = {
      ...this.params,
      sortBy: event.active,
      sortDescending: event.direction === 'desc',
      pageNumber: 1,
    };
    this.pageIndex.set(0);
    this.load();
  }

  // ── Filter events ─────────────────────────────────────────────────────────

  onApply(): void {
    // strip null values
    this.filterValues = Object.fromEntries(
      Object.entries(this.filters).filter(([, v]) => v !== null && v !== undefined)
    ) as CompanyTaskFilters;
    this.params = { ...this.params, pageNumber: 1 };
    this.pageIndex.set(0);
    this.load();
  }

  onReset(): void {
    this.filters = { importance: null, status: null, departmentId: null };
    this.filterValues = {};
    this.params = { pageNumber: 1, pageSize: this.pageSize };
    this.pageIndex.set(0);
    this.load();
  }

  // ── Action handlers ───────────────────────────────────────────────────────

  onAdd(): void {
    const ref = this.dialog.open(CompanyTaskForm, { width: '600px', data: { task: null } });
    ref.afterClosed().subscribe(saved => {
      if (saved) this.load();
    });
    console.log('Add task');
  }

  onView(row: PaginatedCompanyTaskDto): void {
    const ref = this.dialog.open(CompanyTaskView, { width: '1000px', data: { taskId: row.id } });
    console.log('View', row);
  }

  onEdit(row: PaginatedCompanyTaskDto): void {
    const ref = this.dialog.open(CompanyTaskForm, { width: '600px', data: { task: row } });
    ref.afterClosed().subscribe(saved => {
      if (saved) this.load();
    });
    console.log('Edit', row);
  }

  onDelete(row: PaginatedCompanyTaskDto): void {
    this.taskService.delete(row.id).subscribe(result => {
      if (result.isSuccess) this.load();
    });
  }

  onChangeStatus(row: PaginatedCompanyTaskDto): void {
    const ref = this.dialog.open(CompanyTaskChangeStatus, {
      width: '400px',
      data: { task: row },
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) this.load();
    });
  }

  onManageAssignees(row: PaginatedCompanyTaskDto): void {
    const ref = this.dialog.open(CompanyTaskManageAssignees, {
      width: '520px',
      data: { task: row },
    });
    ref.afterClosed().subscribe((dirty: boolean) => {
      if (dirty) this.load(); // reload only if assign/unassign happened
    });
  }

  can(permission: string): boolean {
    return !!this.permissionsService.getPermission(permission);
  }
}
