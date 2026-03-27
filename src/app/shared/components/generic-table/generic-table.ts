import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableActionButton<T> {
  icon: string;
  tooltip: string;
  warn?: boolean;
  confirm?: boolean;
  show?: boolean;
  click: (row: T) => void;
}

export interface TablePageEvent {
  pageIndex: number;
  pageSize: number;
}

export interface TableSortEvent {
  active: string;
  direction: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.html',
  imports: [CommonModule, MtxGridModule, MatButtonModule, MatIconModule, MatCardModule],
})
export class GenericTableComponent<T> implements OnChanges {
  @ContentChild('toolbarActions') toolbarActions?: TemplateRef<void>;
  @ContentChild('filterContent') filterContent?: TemplateRef<void>;

  private readonly translate = inject(TranslateService);

  // ── Data inputs ──────────────────────────────────────────────────────────

  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) columns: MtxGridColumn[] = [];
  @Input() totalCount      = 0;
  @Input() pageIndex       = 0;
  @Input() pageSize        = 10;
  @Input() isLoading       = false;
  @Input() pageSizeOptions = [5, 10, 25, 50];

  // ── Action toggles ───────────────────────────────────────────────────────

  @Input() showView     = true;
  @Input() showEdit     = true;
  @Input() showDelete   = true;
  @Input() extraActions: TableActionButton<T>[] = [];

  // ── Outputs ──────────────────────────────────────────────────────────────

  @Output() view       = new EventEmitter<T>();
  @Output() edit       = new EventEmitter<T>();
  @Output() delete     = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() filtersApplied = new EventEmitter<void>();
  @Output() filtersReset   = new EventEmitter<void>();

  // ── Internal ─────────────────────────────────────────────────────────────

  internalColumns: MtxGridColumn[] = [];
  showFilters = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['columns']      ||
      changes['showView']     ||
      changes['showEdit']     ||
      changes['showDelete']   ||
      changes['extraActions']
    ) {
      this.buildColumns();
    }
  }

  private buildColumns(): void {
    const buttons: any[] = [];

    if (this.showView) {
      buttons.push({
        type:    'icon',
        icon:    'visibility',
        tooltip: this.translate.instant('view'),
        click:   (row: T) => this.view.emit(row),
      });
    }

    if (this.showEdit) {
      buttons.push({
        type:    'icon',
        icon:    'edit',
        tooltip: this.translate.instant('edit'),
        click:   (row: T) => this.edit.emit(row),
      });
    }

    if (this.showDelete) {
      buttons.push({
        type:    'icon',
        color:   'warn',
        icon:    'delete',
        tooltip: this.translate.instant('delete'),
        pop: {
          title:     this.translate.instant('confirm_delete'),
          closeText: this.translate.instant('close'),
          okText:    this.translate.instant('ok'),
        },
        click: (row: T) => this.delete.emit(row),
      });
    }

    for (const action of this.extraActions) {
      if (action.show !== false) {
      buttons.push({
        type:    'icon',
        icon:    action.icon,
        color:   action.warn ? 'warn' : undefined,
        tooltip: action.tooltip,
        ...(action.confirm ? {
          pop: {
            title:     action.tooltip,
            closeText: this.translate.instant('close'),
            okText:    this.translate.instant('ok'),
          },
        } : {}),
        click: (row: T) => action.click(row),
      });
      }
    }

    this.internalColumns = buttons.length > 0
      ? [
          ...this.columns,
          {
            header:  this.translate.instant('operation'),
            field:   'operation',
            minWidth: 60 + buttons.length * 40,
            pinned:  'right',
            type:    'button',
            buttons,
          } as MtxGridColumn,
        ]
      : [...this.columns];
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageChange.emit(event);
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.sortChange.emit(event);
  }
}
