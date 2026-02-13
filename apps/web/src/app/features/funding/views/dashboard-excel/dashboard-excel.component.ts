import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { DailyAccountStatus } from '../../models/daily-status';
import { AccountStateSnapshot } from '../../models/snapshot';
import { DayCellComponent } from '../../components/day-cell/day-cell.component';
import { StateLegendComponent } from '../../components/state-legend/state-legend.component';
import { OperationalState, STATE_LABELS } from '../../models/operational-state';

interface AccountRow {
  accountId: string;
  accountName: string;
  snapshot: AccountStateSnapshot | null;
  days: Map<string, DailyAccountStatus>;
}

@Component({
  selector: 'app-dashboard-excel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ScrollingModule, TagModule, ProgressSpinnerModule, TooltipModule, PageLayoutComponent, DayCellComponent, StateLegendComponent],
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
        <div class="overflow-x-auto border border-surface-200 rounded-lg">
          <table class="min-w-full text-xs">
            <thead>
              <tr class="bg-surface-100">
                <th class="sticky left-0 z-10 bg-surface-100 px-3 py-2 text-left min-w-[140px]">Account</th>
                <th class="px-2 py-2 text-center min-w-[90px]">State</th>
                <th class="px-2 py-2 text-right min-w-[80px]">Balance</th>
                @for (day of dateColumns(); track day) {
                  <th class="px-1 py-2 text-center min-w-[52px]"
                      [class.bg-orange-50]="isWeekend(day)">
                    {{ day | date:'dd' }}<br/>
                    <span class="text-[9px] opacity-60">{{ day | date:'EEE' }}</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.accountId) {
                <tr class="border-t border-surface-100 hover:bg-surface-50">
                  <td class="sticky left-0 z-10 bg-surface-0 px-3 py-1.5 font-medium">{{ row.accountName }}</td>
                  <td class="px-2 py-1.5 text-center">
                    <p-tag [value]="stateLabel(row.snapshot?.operationalState)"
                           [severity]="stateSeverity(row.snapshot?.operationalState)" />
                  </td>
                  <td class="px-2 py-1.5 text-right font-mono">
                    {{ row.snapshot?.balance | currency:'USD':'symbol':'1.0-0' }}
                  </td>
                  @for (day of dateColumns(); track day) {
                    <td class="p-0.5">
                      <app-day-cell
                        [state]="getDayState(row, day)"
                        [pnl]="getDayPnl(row, day)"
                        [tradesCount]="getDayTrades(row, day)"
                        [isWeekend]="isWeekend(day)"
                      />
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
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

  dateColumns = computed(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  });

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
      case OperationalState.CHALLENGE: return 'secondary';
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
}
