import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { DepartmentService } from '../departments.service';
import { EmployeeService, EmployeeListDto } from '../../employees/employees.service';

// ─── Dialog data shape ────────────────────────────────────────────────────────

export interface DepartmentDialogData {
  /** Pass an existing department for edit, null for add */
  department?: { id: number; name: string; managerId: number } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-department-form',
  templateUrl: './department-form.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class DepartmentFormDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DepartmentFormDialog>);
  private readonly data = inject<DepartmentDialogData>(MAT_DIALOG_DATA);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);

  isEdit = !!this.data?.department;
  isSaving = false;
  isLoadingEmployees = false;
  employees: EmployeeListDto[] = [];

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
    managerId: new FormControl<number | null>(null), // No validator by default
  });

  ngOnInit(): void {
    if (this.isEdit && this.data.department) {
      // Add the required validator only in edit mode
      this.form.get('managerId')!.addValidators(Validators.required);
      this.form.get('managerId')!.updateValueAndValidity();

      this.loadEmployees(this.data.department.id);
      this.form.patchValue({
        name: this.data.department.name,
        managerId: this.data.department.managerId,
      });
    }
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private loadEmployees(departmentId: number): void {
    this.isLoadingEmployees = true;
    this.departmentService.getDepartmentEmployees(departmentId).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.employees = result.result;
        }
        this.isLoadingEmployees = false;
      },
      error: () => {
        this.isLoadingEmployees = false;
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const { name, managerId } = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.departmentService.edit(this.data.department!.id, {
          name: name!,
          managerId: managerId!,
        })
      : this.departmentService.add({ name: name! }); // No managerId sent

    request$.subscribe({
      next: result => {
        if (result.isSuccess) {
          this.dialogRef.close(true); // true = refresh the table
        }
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get title(): string {
    return this.isEdit ? 'Edit Department' : 'New Department';
  }

  get nameError(): string {
    const ctrl = this.form.get('name')!;
    if (ctrl.hasError('required')) return 'Name is required';
    if (ctrl.hasError('minlength')) return 'Name must be at least 2 characters';
    return '';
  }

  get managerError(): string {
    return this.form.get('managerId')!.hasError('required') ? 'Manager is required' : '';
  }
}
