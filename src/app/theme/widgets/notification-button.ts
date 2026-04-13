import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskHubService } from '@core';

interface Notification {
  id: number;
  icon: string;
  message: string;
  read: boolean;
  timestamp: Date;
  taskId: number | null;
}

@Component({
  selector: 'app-notification',
  template: `
    <!-- Bell trigger -->
    <button matIconButton (click)="togglePanel()" #trigger>
      <mat-icon
        [matBadge]="unreadCount() || ''"
        [matBadgeHidden]="unreadCount() === 0"
        matBadgeColor="warn"
        aria-hidden="false">
        notifications
      </mat-icon>
    </button>

    <!-- Floating panel -->
    @if (panelOpen()) {
      <div class="notif-panel" role="dialog" aria-label="Notifications">

        <!-- Header -->
        <div class="notif-header">
          <span class="notif-title">Notifications</span>
          <div class="notif-header-actions">
            @if (notifications().length > 0) {
              <button mat-button class="mark-read-btn" (click)="markAllRead()">
                Mark all read
              </button>
              <button mat-icon-button (click)="clearAll()" matTooltip="Clear all">
                <mat-icon>delete_sweep</mat-icon>
              </button>
            }
          </div>
        </div>

        <mat-divider />

        <!-- List -->
        <div class="notif-list">
          @if (notifications().length === 0) {
            <div class="notif-empty">
              <mat-icon>notifications_none</mat-icon>
              <span>You're all caught up</span>
            </div>
          }

          @for (n of notifications(); track n.id) {
            <div class="notif-item" [class.unread]="!n.read" (click)="markRead(n)">
              <div class="notif-icon-wrap">
                <mat-icon class="notif-icon">{{ n.icon }}</mat-icon>
              </div>
              <div class="notif-body">
                <p class="notif-message">{{ n.message }}</p>
                <span class="notif-time">{{ formatTime(n.timestamp) }}</span>
              </div>
              @if (n.taskId !== null) {
                <button
                  mat-stroked-button
                  class="view-btn"
                  (click)="navigateToTask(n); $event.stopPropagation()">
                  View
                </button>
              }
            </div>

            <mat-divider />
          }
        </div>

      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
    }

    /* ── Panel ───────────────────────────────────────────────── */
    .notif-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-height: 520px;
      display: flex;
      flex-direction: column;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
      z-index: 1000;
      overflow: hidden;
    }

    /* ── Header ──────────────────────────────────────────────── */
    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px;
      flex-shrink: 0;
    }

    .notif-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .notif-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mark-read-btn {
      font-size: 12px;
      height: 28px;
      line-height: 28px;
      padding: 0 8px;
      color: var(--mat-sys-primary);
    }

    /* ── Scrollable list ─────────────────────────────────────── */
    .notif-list {
      overflow-y: auto;
      flex: 1;
    }

    /* ── Empty state ─────────────────────────────────────────── */
    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 24px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: .5;
      }
    }

    /* ── Notification row ────────────────────────────────────── */
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      transition: background 150ms ease;

      &:hover { background: var(--mat-sys-surface-variant); }

      &.unread {
        background: color-mix(in srgb, var(--mat-sys-primary) 6%, transparent);

        &:hover { background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent); }

        .notif-icon { color: var(--mat-sys-primary); }
      }
    }

    .notif-icon-wrap {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .notif-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-on-surface-variant);
    }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-message {
      margin: 0 0 4px;
      font-size: 13px;
      line-height: 1.45;
      color: var(--mat-sys-on-surface);
      white-space: normal;
      word-break: break-word;
    }

    .notif-time {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .view-btn {
      flex-shrink: 0;
      height: 28px;
      line-height: 28px;
      font-size: 12px;
      align-self: center;
    }

    /* ── Badge colour override ───────────────────────────────── */
    :host ::ng-deep .mat-badge-content {
      --mat-badge-background-color: #ef0000;
      --mat-badge-text-color: #fff;
    }
  `,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatRippleModule,
    MatDividerModule,
  ],
})
export class NotificationButton implements OnInit, OnDestroy {
  private readonly hub      = inject(TaskHubService);
  private readonly router   = inject(Router);
  private readonly elRef    = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();
  private nextId            = 0;

  notifications = signal<Notification[]>([]);
  unreadCount   = computed(() => this.notifications().filter(n => !n.read).length);
  panelOpen     = signal(false);

  // ── Close on outside click ──────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.panelOpen.set(false);
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.hub.taskCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('add_task', `Task created: "${p.title}"`, p.taskId));

    this.hub.taskUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('edit', `Task updated: "${p.title}"`, p.taskId));

    this.hub.taskDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('delete', `Task #${p.taskId} was deleted`, null));

    this.hub.taskStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('swap_horiz', `Task #${p.taskId} → ${p.newStatus}`, p.taskId));

    this.hub.employeeAssigned$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('person_add', `Employee assigned to task #${p.taskId}`, p.taskId));

    this.hub.employeeUnassigned$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('person_remove', `Employee removed from task #${p.taskId}`, p.taskId));

    this.hub.milestoneAdded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('flag', `Milestone added: "${p.title}" on task #${p.taskId}`, p.taskId));

    this.hub.milestoneUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('edit_note', `Milestone updated: "${p.title}"`, p.taskId));

    this.hub.milestoneDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('remove_circle', `Milestone #${p.milestoneId} removed from task #${p.taskId}`, p.taskId));

    this.hub.milestoneCompleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('check_circle', `Milestone #${p.milestoneId} completed on task #${p.taskId}`, p.taskId));

    this.hub.milestoneStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.push('pending', `Milestone #${p.milestoneId} → ${p.newStatus}`, p.taskId));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Panel ───────────────────────────────────────────────────────────────

  togglePanel(): void {
    this.panelOpen.update(v => !v);
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  markRead(n: Notification): void {
    this.notifications.update(list =>
      list.map(x => x.id === n.id ? { ...x, read: true } : x)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  navigateToTask(n: Notification): void {
    this.panelOpen.set(false);
    this.router.navigate(['/company-tasks']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)  return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  private push(icon: string, message: string, taskId: number | null): void {
    this.notifications.update(list => [
      { id: this.nextId++, icon, message, read: false, timestamp: new Date(), taskId },
      ...list.slice(0, 49),
    ]);
  }
}
