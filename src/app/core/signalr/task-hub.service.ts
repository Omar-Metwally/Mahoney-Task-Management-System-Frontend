import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { TokenService } from '@core/authentication';
import { environment } from '@env/environment';

// ── Payload shapes (mirror the backend anonymous objects) ─────────────────────

export interface TaskCreatedPayload      { taskId: number; title: string; departmentId: number; }
export interface TaskUpdatedPayload      { taskId: number; title: string; departmentId: number; }
export interface TaskDeletedPayload      { taskId: number; departmentId: number; }
export interface EmployeeAssignedPayload { taskId: number; employeeId: number; departmentId: number; }
export interface EmployeeUnassignedPayload { taskId: number; employeeId: number; departmentId: number; }
export interface TaskStatusChangedPayload  { taskId: number; newStatus: string; departmentId: number; }

export interface MilestoneAddedPayload         { taskId: number; milestoneId: number; title: string; departmentId: number; }
export interface MilestoneUpdatedPayload       { taskId: number; milestoneId: number; title: string; departmentId: number; }
export interface MilestoneDeletedPayload       { taskId: number; milestoneId: number; departmentId: number; }
export interface MilestoneCompletedPayload     { taskId: number; milestoneId: number; departmentId: number; }
export interface MilestoneStatusChangedPayload { taskId: number; milestoneId: number; newStatus: string; departmentId: number; }

@Injectable({ providedIn: 'root' })
export class TaskHubService implements OnDestroy {
  private readonly tokenService = inject(TokenService);
  private hub!: signalR.HubConnection;

  // ── Task subjects ─────────────────────────────────────────────────────────
  readonly taskCreated$        = new Subject<TaskCreatedPayload>();
  readonly taskUpdated$        = new Subject<TaskUpdatedPayload>();
  readonly taskDeleted$        = new Subject<TaskDeletedPayload>();
  readonly employeeAssigned$   = new Subject<EmployeeAssignedPayload>();
  readonly employeeUnassigned$ = new Subject<EmployeeUnassignedPayload>();
  readonly taskStatusChanged$  = new Subject<TaskStatusChangedPayload>();

  // ── Milestone subjects ────────────────────────────────────────────────────
  readonly milestoneAdded$         = new Subject<MilestoneAddedPayload>();
  readonly milestoneUpdated$       = new Subject<MilestoneUpdatedPayload>();
  readonly milestoneDeleted$       = new Subject<MilestoneDeletedPayload>();
  readonly milestoneCompleted$     = new Subject<MilestoneCompletedPayload>();
  readonly milestoneStatusChanged$ = new Subject<MilestoneStatusChangedPayload>();

  startConnection(): void {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.baseUrl}/hubs/tasks`, {
        accessTokenFactory: () => this.tokenService.getBearerToken().replace('Bearer ', ''),
      })
      .withAutomaticReconnect()
      .build();

    // ── Task handlers
    this.hub.on('TaskCreated',        (p: TaskCreatedPayload)        => this.taskCreated$.next(p));
    this.hub.on('TaskUpdated',        (p: TaskUpdatedPayload)        => this.taskUpdated$.next(p));
    this.hub.on('TaskDeleted',        (p: TaskDeletedPayload)        => this.taskDeleted$.next(p));
    this.hub.on('EmployeeAssigned',   (p: EmployeeAssignedPayload)   => this.employeeAssigned$.next(p));
    this.hub.on('EmployeeUnassigned', (p: EmployeeUnassignedPayload) => this.employeeUnassigned$.next(p));
    this.hub.on('TaskStatusChanged',  (p: TaskStatusChangedPayload)  => this.taskStatusChanged$.next(p));

    // ── Milestone handlers
    this.hub.on('MilestoneAdded',         (p: MilestoneAddedPayload)         => this.milestoneAdded$.next(p));
    this.hub.on('MilestoneUpdated',       (p: MilestoneUpdatedPayload)       => this.milestoneUpdated$.next(p));
    this.hub.on('MilestoneDeleted',       (p: MilestoneDeletedPayload)       => this.milestoneDeleted$.next(p));
    this.hub.on('MilestoneCompleted',     (p: MilestoneCompletedPayload)     => this.milestoneCompleted$.next(p));
    this.hub.on('MilestoneStatusChanged', (p: MilestoneStatusChangedPayload) => this.milestoneStatusChanged$.next(p));

    this.hub.start().catch(err => console.error('[TaskHub] Connection error:', err));
  }

  stopConnection(): void {
    this.hub?.stop();
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
