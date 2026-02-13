import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FundingApiService } from '../../services/funding-api.service';
import { AccountCycle } from '../../models/cycle';
import { AccountStateSnapshot } from '../../models/snapshot';
import { DailyAccountStatus } from '../../models/daily-status';
import { OperationalState, STATE_LABELS, STATE_COLORS } from '../../models/operational-state';

@Component({
  selector: 'app-account-timeline',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="p-4 flex flex-col gap-6">
      @if (snapshot(); as snap) {
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-bold">{{ snap.account?.name ?? 'Account' }}</h2>
          <span class="px-2 py-1 rounded text-xs font-bold text-white"
                [style.background-color]="stateColor(snap.operationalState)">
            {{ stateLabel(snap.operationalState) }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-surface-100 rounded-lg p-3">
            <div class="text-xs text-gray-500">Balance</div>
            <div class="text-lg font-bold">{{ snap.balance | currency:'USD' }}</div>
          </div>
          <div class="bg-surface-100 rounded-lg p-3">
            <div class="text-xs text-gray-500">Cycle Start</div>
            <div class="text-lg font-bold">{{ snap.cycleStartBalance | currency:'USD' }}</div>
          </div>
          <div class="bg-surface-100 rounded-lg p-3">
            <div class="text-xs text-gray-500">Profit %</div>
            <div class="text-lg font-bold" [class.text-green-500]="snap.profitPct > 0">
              {{ snap.profitPct | number:'1.2-2' }}%
            </div>
          </div>
          <div class="bg-surface-100 rounded-lg p-3">
            <div class="text-xs text-gray-500">Drawdown %</div>
            <div class="text-lg font-bold" [class.text-red-500]="snap.drawdownPct > 0">
              {{ snap.drawdownPct | number:'1.2-2' }}%
            </div>
          </div>
        </div>
      }

      <h3 class="text-lg font-semibold">Cycles</h3>
      @for (cycle of cycles(); track cycle.id) {
        <div class="border border-surface-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold">
              {{ cycle.startDate | date:'mediumDate' }}
              @if (cycle.endDate) {
                → {{ cycle.endDate | date:'mediumDate' }}
              } @else {
                → Active
              }
            </span>
            <span class="text-xs px-2 py-0.5 rounded"
                  [class.bg-green-100]="cycle.status === 'ACTIVE'"
                  [class.bg-gray-100]="cycle.status === 'CLOSED'">
              {{ cycle.status }}
            </span>
          </div>
          <div class="text-xs text-gray-500">
            Start balance: {{ cycle.cycleStartBalance | currency:'USD' }} | Target: {{ cycle.profitTargetPct }}%
          </div>
        </div>
      }

      <h3 class="text-lg font-semibold">Daily History</h3>
      @if (dailyStatuses().length === 0) {
        <p class="text-gray-400 text-sm">No daily status data yet.</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead>
              <tr class="bg-surface-100">
                <th class="px-3 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">State</th>
                <th class="px-3 py-2 text-right">PnL</th>
                <th class="px-3 py-2 text-right">Balance EOD</th>
                <th class="px-3 py-2 text-center">Trades</th>
              </tr>
            </thead>
            <tbody>
              @for (ds of dailyStatuses(); track ds.id) {
                <tr class="border-t border-surface-100">
                  <td class="px-3 py-1.5">{{ ds.date | date:'mediumDate' }}</td>
                  <td class="px-3 py-1.5">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          [style.background-color]="stateColor(ds.operationalState)">
                      {{ stateLabel(ds.operationalState) }}
                    </span>
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono"
                      [class.text-green-600]="ds.pnlDay > 0"
                      [class.text-red-500]="ds.pnlDay < 0">
                    {{ ds.pnlDay | currency:'USD':'symbol':'1.2-2' }}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono">{{ ds.balanceEod | currency:'USD' }}</td>
                  <td class="px-3 py-1.5 text-center">{{ ds.tradesCount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AccountTimelineComponent implements OnInit {
  private api = inject(FundingApiService);
  private route = inject(ActivatedRoute);

  snapshot = signal<AccountStateSnapshot | null>(null);
  cycles = signal<AccountCycle[]>([]);
  dailyStatuses = signal<DailyAccountStatus[]>([]);

  ngOnInit() {
    const accountId = this.route.snapshot.paramMap.get('accountId');
    if (!accountId) return;

    this.api.getAccountSnapshot(accountId).subscribe(s => this.snapshot.set(s));
    this.api.getAccountCycles(accountId).subscribe(c => this.cycles.set(c));
    this.api.getAccountDailyStatus(accountId).subscribe(ds => this.dailyStatuses.set(ds));
  }

  stateLabel(state: OperationalState): string {
    return STATE_LABELS[state] ?? state;
  }

  stateColor(state: OperationalState): string {
    return STATE_COLORS[state] ?? '#9CA3AF';
  }
}
