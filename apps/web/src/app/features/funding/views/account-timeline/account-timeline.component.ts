import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { AccountCycle } from '../../models/cycle';
import { AccountStateSnapshot } from '../../models/snapshot';
import { DailyAccountStatus } from '../../models/daily-status';
import { OperationalState, STATE_LABELS } from '../../models/operational-state';

@Component({
  selector: 'app-account-timeline',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, TableModule, TagModule, CardModule, ProgressSpinnerModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="pageTitle()"
      subtitle="Timeline del ciclo actual y historial diario">

      @if (snapshot(); as snap) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <p-card>
            <div class="text-xs text-gray-500">Balance</div>
            <div class="text-lg font-bold">{{ snap.balance | currency:'USD' }}</div>
          </p-card>
          <p-card>
            <div class="text-xs text-gray-500">Inicio Ciclo</div>
            <div class="text-lg font-bold">{{ snap.cycleStartBalance | currency:'USD' }}</div>
          </p-card>
          <p-card>
            <div class="text-xs text-gray-500">Profit %</div>
            <div class="text-lg font-bold" [class.text-green-500]="snap.profitPct > 0">
              {{ snap.profitPct | number:'1.2-2' }}%
            </div>
          </p-card>
          <p-card>
            <div class="text-xs text-gray-500">Drawdown %</div>
            <div class="text-lg font-bold" [class.text-red-500]="snap.drawdownPct > 0">
              {{ snap.drawdownPct | number:'1.2-2' }}%
            </div>
          </p-card>
        </div>
      }

      <h3 class="text-lg font-semibold mb-4">Ciclos</h3>
      @for (cycle of cycles(); track cycle.id) {
        <div class="border border-surface-200 rounded-lg p-4 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold">
              {{ cycle.startDate | date:'mediumDate' }}
              @if (cycle.endDate) {
                → {{ cycle.endDate | date:'mediumDate' }}
              } @else {
                → Activo
              }
            </span>
            <p-tag [value]="cycle.status === 'ACTIVE' ? 'Activo' : 'Cerrado'"
                   [severity]="cycle.status === 'ACTIVE' ? 'success' : 'secondary'" />
          </div>
          <div class="text-xs text-gray-500">
            Balance inicio: {{ cycle.cycleStartBalance | currency:'USD' }} | Objetivo: {{ cycle.profitTargetPct }}%
          </div>
        </div>
      }

      <h3 class="text-lg font-semibold mt-6 mb-4">Historial Diario</h3>
      @if (dailyStatuses().length === 0) {
        <p class="text-gray-400 text-sm">Aún no hay datos de estado diario.</p>
      } @else {
        <p-table [value]="dailyStatuses()" [rows]="30" [paginator]="dailyStatuses().length > 30"
                 styleClass="p-datatable-sm p-datatable-striped"
                 [rowHover]="true">
          <ng-template #header>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th class="text-right">PnL</th>
              <th class="text-right">Balance EOD</th>
              <th class="text-center">Trades</th>
            </tr>
          </ng-template>
          <ng-template #body let-ds>
            <tr>
              <td>{{ ds.date | date:'mediumDate' }}</td>
              <td>
                <p-tag [value]="stateLabel(ds.operationalState)"
                       [severity]="stateSeverity(ds.operationalState)" />
              </td>
              <td class="text-right font-mono"
                  [class.text-green-600]="ds.pnlDay > 0"
                  [class.text-red-500]="ds.pnlDay < 0">
                {{ ds.pnlDay | currency:'USD':'symbol':'1.2-2' }}
              </td>
              <td class="text-right font-mono">{{ ds.balanceEod | currency:'USD' }}</td>
              <td class="text-center">{{ ds.tradesCount }}</td>
            </tr>
          </ng-template>
        </p-table>
      }
    </app-page-layout>
  `,
})
export class AccountTimelineComponent implements OnInit {
  private api = inject(FundingApiService);
  private route = inject(ActivatedRoute);

  snapshot = signal<AccountStateSnapshot | null>(null);
  cycles = signal<AccountCycle[]>([]);
  dailyStatuses = signal<DailyAccountStatus[]>([]);
  pageTitle = signal('Detalle de Cuenta');

  ngOnInit() {
    const accountId = this.route.snapshot.paramMap.get('accountId');
    if (!accountId) return;

    this.api.getAccountSnapshot(accountId).subscribe(s => {
      this.snapshot.set(s);
      if (s?.account?.name) {
        this.pageTitle.set(s.account.name);
      }
    });
    this.api.getAccountCycles(accountId).subscribe(c => this.cycles.set(c));
    this.api.getAccountDailyStatus(accountId).subscribe(ds => this.dailyStatuses.set(ds));
  }

  stateLabel(state: OperationalState): string {
    return STATE_LABELS[state] ?? state;
  }

  stateSeverity(state: OperationalState): 'success' | 'danger' | 'info' | 'warn' | 'secondary' | 'contrast' {
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
}
