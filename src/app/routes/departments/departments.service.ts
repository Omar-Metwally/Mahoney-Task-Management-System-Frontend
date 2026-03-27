import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService, Result } from '@shared/services/base-api.service';
import { EmployeeListDto } from '../employees/employees.service';
import { Observable } from 'rxjs';

// ─── Read DTO (response model) ────────────────────────────────────────────────

export interface PaganitedDepartmentDto {
  id: number;
  name: string;
  managerId: number;
  managerName: string;
  employeeCount: number;
}

// ─── Write models (mirror the backend commands) ───────────────────────────────

/** Mirrors AddDepartmentCommand */
export interface AddDepartmentModel {
  name: string;
}

/** Mirrors EditDepartmentCommand — all fields except id are optional */
export interface EditDepartmentModel {
  name?: string;
  managerId?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DepartmentService extends BaseApiService<
  PaganitedDepartmentDto,       // read
  AddDepartmentModel,  // create
  EditDepartmentModel, // update
  number               // id
> {
  protected readonly endpoint = 'departments';

  constructor(http: HttpClient) {
    super(http);
  }

    getDepartmentEmployees(departmentId: number): Observable<Result<EmployeeListDto[]>> {
      return this.http.get<Result<EmployeeListDto[]>>(
        `${this.baseUrl}/employees/${departmentId}`
      );
    }
}
