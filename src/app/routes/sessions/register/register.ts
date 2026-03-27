import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // Added for password toggle
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LoginService } from '@core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, filter } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule,
  ],
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  // State management using signals to match your EmployeeForm style
  isSaving = signal(false);
  showPassword = signal(false);

  registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[A-Z]/), // at least one uppercase
          Validators.pattern(/[0-9]/), // at least one digit
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.matchValidator('password', 'confirmPassword')],
    }
  );

  matchValidator(source: string, target: string) {
    return (control: AbstractControl) => {
      const sourceControl = control.get(source)!;
      const targetControl = control.get(target)!;

      if (targetControl.errors && !targetControl.errors['mismatch']) {
        return null;
      }

      if (sourceControl.value !== targetControl.value) {
        targetControl.setErrors({ mismatch: true });
        return { mismatch: true };
      } else {
        targetControl.setErrors(null);
        return null;
      }
    };
  }

  // ── Error Getters (Same logic as EmployeeForm) ─────────────────────────────

  get firstNameError(): string {
    const c = this.registerForm.get('firstName')!;
    if (c.hasError('required')) return 'First name is required.';
    if (c.hasError('maxlength')) return 'First name cannot exceed 100 characters.';
    return '';
  }

  get lastNameError(): string {
    const c = this.registerForm.get('lastName')!;
    if (c.hasError('required')) return 'Last name is required.';
    if (c.hasError('maxlength')) return 'Last name cannot exceed 100 characters.';
    return '';
  }

  get usernameError(): string {
    const c = this.registerForm.get('username')!;
    if (c.hasError('required')) return 'Username is required.';
    if (c.hasError('maxlength')) return 'Username cannot exceed 100 characters.';
    return '';
  }

  get emailError(): string {
    const c = this.registerForm.get('email')!;
    if (c.hasError('required')) return 'Email is required.';
    if (c.hasError('email')) return 'A valid email address is required.';
    if (c.hasError('maxlength')) return 'Email cannot exceed 256 characters.';
    return '';
  }

  get passwordError(): string {
    const c = this.registerForm.get('password')!;
    if (c.hasError('required')) return 'Password is required.';
    if (c.hasError('minlength')) return 'Password must be at least 8 characters.';
    if (c.hasError('pattern')) return 'Password must contain at least one uppercase letter and one digit.';
    return '';
  }

  get confirmPasswordError(): string {
    const c = this.registerForm.get('confirmPassword')!;
    if (c.hasError('required')) return 'Please confirm your password.';
    if (c.hasError('mismatch')) return 'Passwords do not match.';
    return '';
  }

  onSubmit() {
    if (this.registerForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const formValue = this.registerForm.getRawValue();
    this.loginService.firstUserSignup(formValue.firstName, formValue.lastName, formValue.username, formValue.email, formValue.password).pipe(
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/auth/login');
        },
        error: (errorRes: HttpErrorResponse) => {
          console.error(errorRes);
        },
      });;
  }
}
