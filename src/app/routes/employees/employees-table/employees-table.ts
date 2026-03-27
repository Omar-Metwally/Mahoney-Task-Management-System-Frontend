import { Component, inject, signal, OnInit } from '@angular/core';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import {
  GenericTableComponent,
  TablePageEvent,
  TableSortEvent,
} from '@shared/components/generic-table/generic-table';
import { EmployeeService, PaginatedEmployeeDto } from '../employees.service';
import { DepartmentService, PaganitedDepartmentDto } from '../../departments/departments.service';
import { PaginationParameters } from '@shared/services/base-api.service';
import { PageHeader } from '@shared';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeForm } from '../employee-form/employee-form';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '@core';

@Component({
  selector: 'app-employees-table',
  imports: [
    GenericTableComponent,
    FormsModule,
    PageHeader,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgxPermissionsModule,
  ],
  templateUrl: './employees-table.html',
  styleUrl: './employees-table.scss',
})
export class EmployeesTable implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);
  private readonly permissionsService = inject(NgxPermissionsService);
  private readonly authService = inject(AuthService);

  // ── Table state ───────────────────────────────────────────────────────────

  data = signal<PaginatedEmployeeDto[]>([]);
  totalCount = signal(0);
  pageIndex = signal(0);
  isLoading = signal(false);
  pageSize = 10;
  isAdmin = signal(false);

  departments = signal<{ id: number; name: string }[]>([]);

  filters: Record<string, any> = {
    searchTerm: '',
    departmentId: null,
  };

  private params: PaginationParameters = {
    pageNumber: 1,
    pageSize: 10,
  };

  // ── Column definitions ────────────────────────────────────────────────────

  columns: MtxGridColumn[] = [
    { header: 'ID', field: 'id', minWidth: 60 },
    { header: 'First Name', field: 'firstName', minWidth: 80, sortable: true },
    { header: 'Last Name', field: 'lastName', minWidth: 80, sortable: true },
    { header: 'Username', field: 'username', minWidth: 130, sortable: true },
    { header: 'Email', field: 'email', minWidth: 180, sortable: true },
    { header: 'Department', field: 'departmentName', minWidth: 140 },
    { header: 'Role', field: 'companyRole', minWidth: 140 },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.authService.user().subscribe(user => {
      this.isAdmin.set(user?.CompanyRole === 'Admin');
      if (this.isAdmin()) this.loadDepartments();
    });
    this.load();
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  load(): void {
    this.isLoading.set(true);
    this.employeeService.getPaginated(this.params, this.filters).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.data.set(result.result.data);
          this.totalCount.set(result.result.totalCount);
          this.pageIndex.set(result.result.pageNumber - 1);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private loadDepartments(): void {
    this.departmentService.getPaginated({ pageNumber: 1, pageSize: 100 }, {}).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.departments.set(result.result.data.map(d => ({ id: d.id, name: d.name })));
        }
      },
    });
  }

  // ── Table event handlers ──────────────────────────────────────────────────

  onPageChange(event: TablePageEvent): void {
    this.params = {
      ...this.params,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize,
    };
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

  onApply(): void {
    this.params = { ...this.params, pageNumber: 1 };
    this.pageIndex.set(0);
    this.load();
  }

  onReset(): void {
    this.filters = { searchTerm: '', departmentId: null };
    this.params = { pageNumber: 1, pageSize: this.pageSize };
    this.pageIndex.set(0);
    this.load();
  }

  private openDialog(employee: PaginatedEmployeeDto | null): void {
    const ref = this.dialog.open(EmployeeForm, {
      width: '500px',
      data: { employee },
    });

    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) this.load();
    });
  }

  // ── Action handlers ───────────────────────────────────────────────────────

  onView(row: PaginatedEmployeeDto): void {
    console.log('View', row);
  }

  onEdit(row: PaginatedEmployeeDto): void {
    this.openDialog(row);
  }

  onDelete(row: PaginatedEmployeeDto): void {
    this.employeeService.delete(row.id).subscribe(result => {
      if (result.isSuccess) this.load();
    });
  }

  onAdd(): void {
    this.openDialog(null);
  }

  can(permission: string): boolean {
    return !!this.permissionsService.getPermission(permission);
  }
}
