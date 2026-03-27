import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApiService, Result } from '@shared/services/base-api.service';
import { environment } from '@env/environment';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TaskImportance {
  Low      = 1,
  Medium   = 2,
  High     = 3,
  Critical = 4,
}

export const TASK_IMPORTANCE_OPTIONS = [
  { label: 'Low',      value: TaskImportance.Low      },
  { label: 'Medium',   value: TaskImportance.Medium   },
  { label: 'High',     value: TaskImportance.High     },
  { label: 'Critical', value: TaskImportance.Critical },
];

export enum TaskStatus {
  Ongoing   = 0,
  OnHold    = 1,
  Completed = 2,
  Cancelled = 3,
}

export const TASK_STATUS_OPTIONS = [
  { label: 'Ongoing',   value: TaskStatus.Ongoing   },
  { label: 'On Hold',   value: TaskStatus.OnHold    },
  { label: 'Completed', value: TaskStatus.Completed },
  { label: 'Cancelled', value: TaskStatus.Cancelled },
];

export enum MilestoneStatus {
  Pending    = 0,
  InProgress = 1,
  Completed  = 2,
}

export const MILESTONE_STATUS_OPTIONS = [
  { label: 'Pending',     value: MilestoneStatus.Pending    },
  { label: 'In Progress', value: MilestoneStatus.InProgress },
  { label: 'Completed',   value: MilestoneStatus.Completed  },
];

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface PaginatedCompanyTaskDto {
  id: number;
  title: string;
  description: string;
  importance: TaskImportance;
  status: TaskStatus;
  isCompleted: boolean;
  departmentId: number;
  departmentName: string;
  assigneesCount: number;
  dueTime: string | null;
}

export interface CompanyTaskMilestoneDto {
  id: number;
  title: string;
  description: string;
  status: MilestoneStatus;
  isCompleted: boolean;
  dueTime: string | null;
}

export interface CompanyTaskDetailDto {
  id: number;
  title: string;
  description: string;
  importance: TaskImportance;
  status: TaskStatus;
  isCompleted: boolean;
  departmentId: number;
  departmentName: string;
  dueTime: string | null;
  milestones: CompanyTaskMilestoneDto[];
}

export interface CompanyTaskFilters {
  departmentId?: number | null;
  importance?:   TaskImportance | null;
  status?:       TaskStatus | null;
}

// ─── Write models ─────────────────────────────────────────────────────────────

export interface AddCompanyTaskModel {
  title: string;
  description: string;
  importance: TaskImportance;
  departmentId?: number | null;
  dueTime?: string | null;
}

export interface EditCompanyTaskModel {
  title?: string;
  description?: string;
  importance?: TaskImportance;
  dueTime?: string | null;
}

export interface TaskEmployeeModel { employeeId: number; }
export interface ChangeTaskStatusModel { newStatus: TaskStatus; }

export interface AddMilestoneModel {
  title: string;
  description: string;
  dueTime?: string | null;
}

export interface EditMilestoneModel {
  title?: string;
  description?: string;
  dueTime?: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CompanyTaskService extends BaseApiService<
  PaginatedCompanyTaskDto,
  AddCompanyTaskModel,
  EditCompanyTaskModel,
  number
> {
  protected readonly endpoint = 'companyTasks';

  constructor(http: HttpClient) {
    super(http, environment.baseUrl);
  }

  // ── Task ──────────────────────────────────────────────────────────────────

  getTaskDetail(id: number): Observable<Result<CompanyTaskDetailDto>> {
    return this.http.get<Result<CompanyTaskDetailDto>>(`${this.baseUrl}/${id}`);
  }

  assignEmployee(taskId: number, body: TaskEmployeeModel): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/${taskId}/assignees`, body);
  }

  unassignEmployee(taskId: number, employeeId: number): Observable<Result<void>> {
    return this.http.delete<Result<void>>(`${this.baseUrl}/${taskId}/assignees/${employeeId}`);
  }

  changeStatus(taskId: number, body: ChangeTaskStatusModel): Observable<Result<void>> {
    return this.http.patch<Result<void>>(`${this.baseUrl}/${taskId}/status`, body);
  }

  getAssignees(taskId: number): Observable<Result<{ id: number; fullName: string; email: string }[]>> {
    return this.http.get<Result<{ id: number; fullName: string; email: string }[]>>(
      `${this.baseUrl}/${taskId}/assignees`
    );
  }

  // ── Milestones ────────────────────────────────────────────────────────────

  /** POST /companyTasks/{taskId}/milestones */
  addMilestone(taskId: number, body: AddMilestoneModel): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/${taskId}/milestones`, body);
  }

  /** PUT /companyTasks/{taskId}/milestones/{milestoneId} */
  editMilestone(taskId: number, milestoneId: number, body: EditMilestoneModel): Observable<Result<void>> {
    return this.http.put<Result<void>>(`${this.baseUrl}/${taskId}/milestones/${milestoneId}`, body);
  }

  /** DELETE /companyTasks/{taskId}/milestones/{milestoneId} */
  deleteMilestone(taskId: number, milestoneId: number): Observable<Result<void>> {
    return this.http.delete<Result<void>>(`${this.baseUrl}/${taskId}/milestones/${milestoneId}`);
  }

  /**
   * PUT /companyTasks/{taskId}/milestones/{milestoneId}/status
   * Body is the raw MilestoneStatus enum integer
   */
  changeMilestoneStatus(taskId: number, milestoneId: number, status: MilestoneStatus): Observable<Result<void>> {
    return this.http.put<Result<void>>(
      `${this.baseUrl}/${taskId}/milestones/${milestoneId}/status`,
      status
    );
  }
}
