import { Component, inject, signal, ViewChild } from '@angular/core';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import {
  GenericTableComponent,
  TableActionButton,
  TablePageEvent,
  TableSortEvent,
} from '@shared/components/generic-table/generic-table';
import { DepartmentService, PaganitedDepartmentDto } from '../departments.service';
import { PaginationParameters } from '@shared/services/base-api.service';
import { PageHeader } from '@shared';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DepartmentFormDialog } from '../department-form/department-form';
import { NgxPermissionsModule } from 'ngx-permissions';

@Component({
  selector: 'app-departments-table',
  imports: [
    GenericTableComponent,
    FormsModule,
    PageHeader,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    NgxPermissionsModule
  ],
  templateUrl: './departments-table.html',
  styleUrl: './departments-table.scss',
})
export class DepartmentsTable {
  private readonly departmentService = inject(DepartmentService);
  private readonly dialog = inject(MatDialog);

  // ── Table state ───────────────────────────────────────────────────────────

  data = signal<PaganitedDepartmentDto[]>([]);
  totalCount = signal(0);
  pageIndex = signal(0);
  isLoading = signal(false);
  pageSize = 10;

  filters: Record<string, any> = {
    searchTerm: '',
    managerId: null,
    startDate: null,
    endDate: null,
  };
  private params: PaginationParameters = {
    pageNumber: 1,
    pageSize: 10,
  };

  // ── Column definitions ────────────────────────────────────────────────────

  columns: MtxGridColumn[] = [
    { header: 'ID', field: 'id', minWidth: 60 },
    { header: 'Name', field: 'name', minWidth: 140, sortable: true },
    { header: 'Manager', field: 'managerName', minWidth: 140 },
    { header: 'Employee Count', field: 'employeeCount', minWidth: 120 },
  ];

  // Example extra action beyond the built-in view/edit/delete
  extraActions: TableActionButton<PaganitedDepartmentDto>[] = [
    {
      icon: 'group',
      tooltip: 'View Employees',
      click: row => this.onViewEmployees(row),
    },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  load(): void {
    this.isLoading.set(true);
    this.departmentService.getPaginated(this.params, this.filters).subscribe({
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
    this.filters = { searchTerm: '', managerId: null, startDate: null, endDate: null };
    this.params = { pageNumber: 1, pageSize: this.pageSize };
    this.pageIndex.set(0);
    this.load();
  }

  // ── Action handlers ───────────────────────────────────────────────────────

  onView(row: PaganitedDepartmentDto): void {
    // e.g. open detail dialog
    console.log('View', row);
  }

  onEdit(row: PaganitedDepartmentDto): void {
    this.openDialog(row);
  }

  onDelete(row: PaganitedDepartmentDto): void {
    this.departmentService.delete(row.id).subscribe(result => {
      if (result.isSuccess) this.load();
    });
  }
  onAdd(): void {
    this.openDialog(null);
  }

  onViewEmployees(row: PaganitedDepartmentDto): void {
    console.log('View employees for', row.name);
  }

  private openDialog(department: PaganitedDepartmentDto | null): void {
    const ref = this.dialog.open(DepartmentFormDialog, {
      width: '500px',
      data: { department },
    });

    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) this.load();
    });
  }
}
