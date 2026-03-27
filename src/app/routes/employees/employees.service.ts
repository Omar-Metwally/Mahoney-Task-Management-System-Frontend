import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApiService } from '@shared/services/base-api.service';
import { Result, PagedResult, PaginationParameters } from '@shared/services/base-api.service';
import { environment } from '@env/environment';

// ─── Role ─────────────────────────────────────────────────────────────────────

export type Role = 'Employee' | 'Manager' | 'Admin';
export const ROLES: string[] = ['Employee', 'Manager', 'Admin'];

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Used in paginated table */
export interface PaginatedEmployeeDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  departmentId: number;
  departmentName: string;
  roles: string[];
}

/** Minimal shape used in dropdowns (e.g. manager picker) */
export interface EmployeeListDto {
  id: number;
  fullName: string; // fullName
}

// ─── Write models ─────────────────────────────────────────────────────────────

/** Mirrors AddEmployeeCommand */
export interface AddEmployeeModel {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  departmentId: number;
  role: string;
}

/** Mirrors EditEmployeeCommand */
export interface EditEmployeeModel {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

/** Mirrors ChangePasswordCommand */
export interface ChangePasswordModel {
  currentPassword: string;
  newPassword: string;
}

/** Mirrors AddRoleCommand / RemoveRoleCommand */
export interface RoleModel {
  type: string;
  value: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EmployeeService extends BaseApiService<
  PaginatedEmployeeDto,
  AddEmployeeModel,
  EditEmployeeModel,
  number
> {
  protected readonly endpoint = 'employees';

  constructor(http: HttpClient) {
    super(http, environment.baseUrl);
  }

  // ── Custom endpoints ───────────────────────────────────────────────────────

  /**
   * POST /employees/{id}/change-password
   */
  changePassword(id: number, body: ChangePasswordModel): Observable<Result<void>> {
    return this.http.post<Result<void>>(
      `${this.baseUrl}/${id}/change-password`,
      body
    );
  }

  /**
   * POST /employees/{id}/roles
   * Mirrors AddRoleCommand
   */
  addRole(id: number, body: RoleModel): Observable<Result<void>> {
    return this.http.post<Result<void>>(
      `${this.baseUrl}/${id}/roles`,
      body
    );
  }

  /**
   * DELETE /employees/{id}/roles
   * Mirrors RemoveRoleCommand
   */
  removeRole(id: number, body: RoleModel): Observable<Result<void>> {
    return this.http.delete<Result<void>>(
      `${this.baseUrl}/${id}/roles`,
      { body }
    );
  }
}
