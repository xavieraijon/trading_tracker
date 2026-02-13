import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FundingApiService } from '../../services/funding-api.service';
import { DailyAccountStatus } from '../../models/daily-status';
import { AccountStateSnapshot } from '../../models/snapshot';
import { DayCellComponent } from '../../components/day-cell/day-cell.component';
import { StateLegendComponent } from '../../components/state-legend/state-legend.component';
import { OperationalState } from '../../models/operational-state';

interface AccountRow {
  accountId: string;
  accountName: string;
  snapshot: AccountStateSnapshot | null;
  days: Map<string, DailyAccountStatus>;
}

@Component({
  selector: 'app-dashboard-excel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ScrollingModule, DayCellComponent, StateLegendComponent],
  template: `
    <div class="flex flex-col gap-4 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Funded Accounts – Daily Overview</h2>
        <app-state-legend />
      </div>

      @if (loading()) {
        <div class="text-center py-8 text-gray-400">Loading...</div>
      } @else if (rows().length === 0) {
        <div class="text-center py-8 text-gray-400">No funded accounts found</div>
      } @else {
        <div class="overflow-x-auto border border-surface-200 rounded-lg">
          <table class="min-w-full text-xs">
            <thead>
              <tr class="bg-surface-100">
                <th class="sticky left-0 z-10 bg-surface-100 px-3 py-2 text-left min-w-[140px]">Account</th>
                <th class="px-2 py-2 text-center min-w-[56px]">State</th>
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
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          [style.background-color]="getStateColor(row.snapshot?.operationalState)"
                          style="color: white">
                      {{ row.snapshot?.operationalState ?? '—' }}
                    </span>
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
    </div>
  `,
})
export class DashboardExcelComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  snapshots = signal<AccountStateSnapshot[]>([]);
  dailyStatuses = signal<DailyAccountStatus[]>([]);

  // Generate last 30 days as date columns
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

  getStateColor(state?: OperationalState | string): string {
    if (!state) return '#9CA3AF';
    const map: Record<string, string> = {
      BREAK_EVEN: '#3B82F6',
      DRAWDOWN: '#EF4444',
      PROFIT: '#4ADE80',
      PAYOUT_REQUESTED: '#166534',
      PAYOUT_PROCESSING: '#166534',
      CHALLENGE: '#9CA3AF',
    };
    return map[state] ?? '#9CA3AF';
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
