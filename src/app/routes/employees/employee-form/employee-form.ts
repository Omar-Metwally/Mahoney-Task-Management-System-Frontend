import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { EmployeeService, Role, ROLES } from '../employees.service';
import { DepartmentService } from '../../departments/departments.service';

// ─── Dialog data shape ────────────────────────────────────────────────────────

export interface EmployeeDialogData {
  /** Pass an existing employee for edit, null for add */
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    companyRole: string;
  } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class EmployeeForm implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<EmployeeForm>);
  private readonly data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);

  isEdit = computed(() => !!this.data?.employee);  isSaving = signal(false);
  isLoadingDepartments = signal(false);
  showPassword = signal(false);

  availableRoles: string[] = ROLES;
  departments: { id: number; name: string }[] = [];

  // ── Form ──────────────────────────────────────────────────────────────────

  form = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
    lastName:  new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
    username:  new FormControl<string>('', []),   // validators added conditionally below
    email:     new FormControl<string>('', [Validators.required, Validators.email, Validators.maxLength(256)]),
    password:  new FormControl<string>('', []),   // validators added conditionally below
    departmentId: new FormControl<number | null>(null, []),
    role: new FormControl<string>('', [Validators.required]),
  });

  ngOnInit(): void {
    if (this.isEdit() && this.data.employee) {
      console.log(this.data)
      // Edit mode — patch existing values, no username/password/department fields needed
      this.form.patchValue({
        firstName: this.data.employee.firstName,
        lastName:  this.data.employee.lastName,
        email:     this.data.employee.email,
        role:     this.data.employee.companyRole,
      });
    } else {
      // Add mode — enable extra validators
      this.form.get('username')!.addValidators([Validators.required, Validators.maxLength(100)]);
      this.form.get('username')!.updateValueAndValidity();

      this.form.get('password')!.addValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),   // at least one uppercase
        Validators.pattern(/[0-9]/),   // at least one digit
      ]);
      this.form.get('password')!.updateValueAndValidity();

      this.form.get('departmentId')!.addValidators([Validators.required]);
      this.form.get('departmentId')!.updateValueAndValidity();

      this.loadDepartments();
    }
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private loadDepartments(): void {
    this.isLoadingDepartments.set(true);
    this.departmentService.getPaginated({ pageNumber: 1, pageSize: 100 }, {}).subscribe({
      next: result => {
        if (result.isSuccess && result.result) {
          this.departments = result.result.data.map(d => ({ id: d.id, name: d.name }));
        }
        this.isLoadingDepartments.set(false);
      },
      error: () => {
        this.isLoadingDepartments.set(false);
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);

    const { firstName, lastName, username, email, password, departmentId, role } =
      this.form.getRawValue();

    const request$ = this.isEdit()
      ? this.employeeService.edit(this.data.employee!.id, {
          firstName: firstName!,
          lastName:  lastName!,
          email:     email!,
          role:     role!,
        })
      : this.employeeService.add({
          firstName:    firstName!,
          lastName:     lastName!,
          username:     username!,
          email:        email!,
          password:     password!,
          departmentId: departmentId!,
          role:        role!,
        });

    request$.subscribe({
      next: result => {
        if (result.isSuccess) {
          this.dialogRef.close(true);
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // ── Title ─────────────────────────────────────────────────────────────────

  get title(): string {
    return this.isEdit() ? 'Edit Employee' : 'New Employee';
  }

  // ── Error getters ─────────────────────────────────────────────────────────

  get firstNameError(): string {
    const c = this.form.get('firstName')!;
    if (c.hasError('required'))   return 'First name is required.';
    if (c.hasError('maxlength'))  return 'First name cannot exceed 100 characters.';
    return '';
  }

  get lastNameError(): string {
    const c = this.form.get('lastName')!;
    if (c.hasError('required'))   return 'Last name is required.';
    if (c.hasError('maxlength'))  return 'Last name cannot exceed 100 characters.';
    return '';
  }

  get usernameError(): string {
    const c = this.form.get('username')!;
    if (c.hasError('required'))   return 'Username is required.';
    if (c.hasError('maxlength'))  return 'Username cannot exceed 100 characters.';
    return '';
  }

  get emailError(): string {
    const c = this.form.get('email')!;
    if (c.hasError('required'))   return 'Email is required.';
    if (c.hasError('email'))      return 'A valid email address is required.';
    if (c.hasError('maxlength'))  return 'Email cannot exceed 256 characters.';
    return '';
  }

  get passwordError(): string {
    const c = this.form.get('password')!;
    if (c.hasError('required'))   return 'Password is required.';
    if (c.hasError('minlength'))  return 'Password must be at least 8 characters.';
    if (c.hasError('pattern'))    return 'Password must contain at least one uppercase letter and one digit.';
    return '';
  }

  get departmentError(): string {
    return this.form.get('departmentId')!.hasError('required') ? 'A valid department must be assigned.' : '';
  }

  get rolesError(): string {
    return this.form.get('role')!.hasError('required') ? 'At least one role must be assigned.' : '';
  }
}
