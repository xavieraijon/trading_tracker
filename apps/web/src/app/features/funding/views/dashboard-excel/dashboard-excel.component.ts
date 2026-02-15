import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { DailyAccountStatus } from '../../models/daily-status';
import { AccountStateSnapshot } from '../../models/snapshot';
import { StateLegendComponent } from '../../components/state-legend/state-legend.component';
import { OperationalState, STATE_LABELS, STATE_COLORS } from '../../models/operational-state';

/** Misma cabecera que el calendario de Analytics (sección Calendario). */
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type CalendarCell = { type: 'empty' } | { type: 'day'; day: number; dateStr: string };

interface AccountRow {
  accountId: string;
  accountName: string;
  snapshot: AccountStateSnapshot | null;
  days: Map<string, DailyAccountStatus>;
}

@Component({
  selector: 'app-dashboard-excel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, TagModule, ButtonModule, ProgressSpinnerModule, TooltipModule, PageLayoutComponent, StateLegendComponent],
  template: `
    <app-page-layout
      title="Funding Overview"
      subtitle="Vista diaria de todas tus cuentas fondeadas"
      [loading]="loading()">

      <app-state-legend actions />

      @if (loading()) {
        <div class="flex justify-center py-8">
          <p-progressSpinner strokeWidth="3" animationDuration="1s" />
        </div>
      } @else if (rows().length === 0) {
        <div class="text-center py-8 text-gray-400">No funded accounts found</div>
      } @else {
        <!-- Resumen agregado + explicación del calendario -->
        <div class="mb-6 space-y-4">
          <div class="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-surface border border-default shadow-surface">
            <span class="text-sm font-medium text-muted">{{ rows().length }} cuenta{{ rows().length !== 1 ? 's' : '' }}</span>
            @for (item of summaryByState(); track item.state) {
              <span class="flex items-center gap-1.5 text-xs">
                <span class="inline-block w-2.5 h-2.5 rounded-sm shrink-0" [style.background-color]="item.color"></span>
                <span class="text-muted">{{ item.count }} {{ item.label }}</span>
              </span>
            }
          </div>
          <p class="text-xs text-muted max-w-2xl">
            <strong class="text-foreground">Cómo leer el calendario:</strong>
            El color de cada día indica el <strong>estado del ciclo</strong> al cierre de ese día, según el
            <strong>PnL acumulado del ciclo</strong> (no solo el PnL del día).
            <span class="block mt-1">
              <strong>Break Even</strong> = estás por encima de 0 pero aún no has alcanzado el objetivo de beneficio del ciclo.
              <strong class="text-emerald-600"> Profit</strong> = ese día el acumulado ya había alcanzado el objetivo.
              <strong class="text-rose-600"> Drawdown</strong> = el PnL del ciclo es negativo.
            </span>
            Solo los días en los que hay al menos una operación cerrada tienen datos; el resto puede aparecer vacío si no hay trades importados para esa cuenta en esas fechas.
          </p>
        </div>

        <!-- Grid máximo 2 columnas: una tarjeta por cuenta con calendario mensual -->
        <div class="grid gap-4 sm:grid-cols-2">
          @for (row of rows(); track row.accountId) {
            <div class="rounded-xl border border-default bg-surface p-4 shadow-surface">
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="min-w-0 flex-1">
                  <a [routerLink]="['/funding/account', row.accountId]"
                     class="font-semibold text-foreground truncate block hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded">
                    {{ row.accountName }}
                  </a>
                  <p-tag [value]="stateLabel(row.snapshot?.operationalState)"
                         [severity]="stateSeverity(row.snapshot?.operationalState)"
                         class="mt-1.5" />
                </div>
                <div class="text-right font-mono text-sm font-medium shrink-0">
                  {{ row.snapshot?.balance | currency:'USD':'symbol':'1.0-0' }}
                </div>
              </div>

              <!-- Calendario mensual (mismos estilos que sección Calendario) -->
              <div (click)="$event.stopPropagation()">
                <div class="flex items-center justify-between mb-2">
                  <p-button icon="pi pi-chevron-left"
                            [rounded]="true" [text]="true" severity="secondary"
                            size="small"
                            (onClick)="prevMonth(row.accountId)" />
                  <span class="text-sm font-semibold text-foreground min-w-[10rem] text-center">
                    {{ getCardMonthTitle(row.accountId) }}
                  </span>
                  <p-button icon="pi pi-chevron-right"
                            [rounded]="true" [text]="true" severity="secondary"
                            size="small"
                            (onClick)="nextMonth(row.accountId)" />
                </div>
                <div class="calendar-wrapper calendar--compact">
                  <div class="calendar-header">
                    @for (w of weekDayLabels; track w) {
                      <div class="header-cell">{{ w }}</div>
                    }
                  </div>
                  <div class="calendar-body">
                    @for (week of getCalendarWeeks(row.accountId); track week.weekIndex) {
                      <div class="calendar-week-row">
                        @for (cell of week.days; track $index) {
                          @if (cell.type === 'empty') {
                            <div class="day-cell day-out-month">
                              <span class="day-number"> </span>
                            </div>
                          } @else {
                            <div class="day-cell"
                                 [class.has-trades]="getDayTrades(row, cell.dateStr) > 0"
                                 [class.day-cell--weekend]="isWeekend(cell.dateStr)"
                                 [class.day-cell--dark-bg]="getDayNeedsLightText(row, cell.dateStr)"
                                 [style.background-color]="getDayBackgroundColor(row, cell.dateStr)"
                                 [pTooltip]="getDayTooltip(row, cell.dateStr)"
                                 tooltipPosition="top">
                              <span class="day-number">{{ cell.day }}</span>
                              <div class="day-content">
                                @if (getDayPnl(row, cell.dateStr) !== null) {
                                  <span class="pnl-value"
                                        [ngClass]="(getDayPnl(row, cell.dateStr) ?? 0) >= 0 ? 'is-profit' : 'is-loss'">
                                    {{ (getDayPnl(row, cell.dateStr) ?? 0) >= 0 ? '+' : '' }}{{ getDayPnl(row, cell.dateStr) | currency:'USD':'symbol':'1.0-1' }}
                                  </span>
                                } @else if (!isWeekend(cell.dateStr)) {
                                  <span class="pnl-value is-neutral">—</span>
                                }
                                @if (getDayTrades(row, cell.dateStr) > 0) {
                                  <span class="trade-count">{{ getDayTrades(row, cell.dateStr) }} trades</span>
                                }
                              </div>
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </app-page-layout>
  `,
})
export class DashboardExcelComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  snapshots = signal<AccountStateSnapshot[]>([]);
  dailyStatuses = signal<DailyAccountStatus[]>([]);

  /** Rango ampliado (~4 meses) para poder navegar por meses en cada tarjeta. */
  private static readonly DAYS_TO_LOAD = 120;

  dateColumns = computed(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = DashboardExcelComponent.DAYS_TO_LOAD - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  });

  /** Mes seleccionado por tarjeta (accountId -> { year, month }). Por defecto mes actual. */
  selectedMonths = signal<Record<string, { year: number; month: number }>>({});

  weekDayLabels = WEEKDAY_LABELS;

  rows = computed<AccountRow[]>(() => {
    const snaps = this.snapshots();
    const statuses = this.dailyStatuses();

    return snaps.map(s => {
      const accountStatuses = statuses.filter(ds => ds.accountId === s.accountId);
      const days = new Map<string, DailyAccountStatus>();
      accountStatuses.forEach(ds => {
        const dayKey = ds.date.split('T')[0];
        days.set(dayKey, ds);
      });
      return {
        accountId: s.accountId,
        accountName: s.account?.name ?? 'Unknown',
        snapshot: s,
        days,
      };
    });
  });

  /** Orden de prioridad para el resumen (más atención primero). */
  private static readonly STATE_PRIORITY: Record<string, number> = {
    [OperationalState.DRAWDOWN]: 0,
    [OperationalState.PAYOUT_REQUESTED]: 1,
    [OperationalState.PAYOUT_PROCESSING]: 2,
    [OperationalState.PROFIT]: 3,
    [OperationalState.BREAK_EVEN]: 4,
    [OperationalState.REST_DAY]: 5,
  };

  /** Resumen por estado para la barra superior (overview first). */
  summaryByState = computed(() => {
    const r = this.rows();
    const counts: Record<string, number> = {};
    for (const row of r) {
      const state = row.snapshot?.operationalState ?? 'REST_DAY';
      counts[state] = (counts[state] ?? 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([state, count]) => ({
        state,
        count,
        label: STATE_LABELS[state as OperationalState] ?? state,
        color: STATE_COLORS[state as OperationalState] ?? '#9CA3AF',
        order: DashboardExcelComponent.STATE_PRIORITY[state] ?? 99,
      }))
      .sort((a, b) => a.order - b.order);
  });

  /** Mes mostrado en la tarjeta (por defecto mes actual). */
  getCardMonth(accountId: string): { year: number; month: number } {
    const cur = new Date();
    const stored = this.selectedMonths()[accountId];
    return stored ?? { year: cur.getFullYear(), month: cur.getMonth() + 1 };
  }

  setCardMonth(accountId: string, year: number, month: number): void {
    this.selectedMonths.update(m => ({ ...m, [accountId]: { year, month } }));
  }

  getCardMonthTitle(accountId: string): string {
    const { year, month } = this.getCardMonth(accountId);
    const str = new Date(year, month - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  prevMonth(accountId: string): void {
    const { year, month } = this.getCardMonth(accountId);
    if (month === 1) this.setCardMonth(accountId, year - 1, 12);
    else this.setCardMonth(accountId, year, month - 1);
  }

  nextMonth(accountId: string): void {
    const { year, month } = this.getCardMonth(accountId);
    if (month === 12) this.setCardMonth(accountId, year + 1, 1);
    else this.setCardMonth(accountId, year, month + 1);
  }

  /** Celdas del calendario (6×7) para el mes seleccionado. Lunes = primera columna. */
  getCalendarCells(accountId: string): CalendarCell[] {
    const { year, month } = this.getCardMonth(accountId);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startOffset = (first.getDay() + 6) % 7;
    const total = 42;
    const cells: CalendarCell[] = [];
    let day = 1;
    for (let i = 0; i < total; i++) {
      if (i < startOffset || day > daysInMonth) {
        cells.push({ type: 'empty' });
      } else {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ type: 'day', day, dateStr });
        day++;
      }
    }
    return cells;
  }

  /** Agrupa las celdas en 6 semanas de 7 días (misma estructura que el calendario de Analytics). */
  getCalendarWeeks(accountId: string): { weekIndex: number; days: CalendarCell[] }[] {
    const cells = this.getCalendarCells(accountId);
    const weeks: { weekIndex: number; days: CalendarCell[] }[] = [];
    for (let i = 0; i < 6; i++) {
      weeks.push({ weekIndex: i, days: cells.slice(i * 7, (i + 1) * 7) });
    }
    return weeks;
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    const cols = this.dateColumns();
    const from = cols[0];
    const to = cols[cols.length - 1];

    this.api.getSnapshots().subscribe(snaps => {
      this.snapshots.set(snaps);
      const ids = snaps.map(s => s.accountId);
      if (ids.length === 0) {
        this.loading.set(false);
        return;
      }
      this.api.getDailyStatusMatrix(ids, from, to).subscribe(ds => {
        this.dailyStatuses.set(ds);
        this.loading.set(false);
      });
    });
  }

  isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  }

  stateLabel(state?: OperationalState | string): string {
    if (!state) return '—';
    return STATE_LABELS[state as OperationalState] ?? state;
  }

  stateSeverity(state?: OperationalState | string): 'success' | 'danger' | 'info' | 'warn' | 'secondary' {
    switch (state) {
      case OperationalState.BREAK_EVEN: return 'info';
      case OperationalState.DRAWDOWN: return 'danger';
      case OperationalState.PROFIT: return 'success';
      case OperationalState.PAYOUT_REQUESTED: return 'warn';
      case OperationalState.PAYOUT_PROCESSING: return 'warn';
      case OperationalState.REST_DAY: return 'secondary';
      default: return 'secondary';
    }
  }

  getDayState(row: AccountRow, day: string): OperationalState | null {
    return row.days.get(day)?.operationalState ?? null;
  }

  getDayPnl(row: AccountRow, day: string): number | null {
    const ds = row.days.get(day);
    return ds ? Number(ds.pnlDay) : null;
  }

  getDayTrades(row: AccountRow, day: string): number {
    return row.days.get(day)?.tradesCount ?? 0;
  }

  /** Si el fondo del día es oscuro, usar texto claro (legibilidad). */
  getDayNeedsLightText(row: AccountRow, day: string): boolean {
    if (this.isWeekend(day)) return false;
    const color = this.getDayColor(row, day);
    return [
      STATE_COLORS[OperationalState.BREAK_EVEN],
      STATE_COLORS[OperationalState.DRAWDOWN],
      STATE_COLORS[OperationalState.PROFIT],
      STATE_COLORS[OperationalState.PAYOUT_REQUESTED],
      STATE_COLORS[OperationalState.PAYOUT_PROCESSING],
      STATE_COLORS[OperationalState.REST_DAY],
    ].includes(color);
  }

  /** Color de la celda (solo días laborables; fin de semana usa clase .day-cell--weekend). */
  getDayColor(row: AccountRow, day: string): string {
    if (this.isWeekend(day)) return 'transparent';
    const state = this.getDayState(row, day);
    if (!state) return 'transparent';
    return STATE_COLORS[state];
  }

  /** Color de fondo inline: solo si no es fin de semana (el weekend usa CSS). */
  getDayBackgroundColor(row: AccountRow, day: string): string | null {
    if (this.isWeekend(day)) return null;
    const color = this.getDayColor(row, day);
    return color === 'transparent' ? null : color;
  }

  /** Tooltip para cada día (detalle bajo demanda). */
  getDayTooltip(row: AccountRow, day: string): string {
    const parts: string[] = [day ? (new Date(day + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })) : ''];
    const state = this.getDayState(row, day);
    if (state) parts.push(STATE_LABELS[state as OperationalState] ?? state);
    const pnl = this.getDayPnl(row, day);
    if (pnl !== null) parts.push(`PnL día: $${pnl.toFixed(2)}`);
    const trades = this.getDayTrades(row, day);
    if (trades > 0) parts.push(`${trades} operaciones`);
    if (this.isWeekend(day)) parts.push('Fin de semana');
    if (!state && !this.isWeekend(day) && pnl === null && trades === 0) parts.push('Sin datos (no hay operaciones cerradas este día)');
    return parts.join(' · ');
  }
}
