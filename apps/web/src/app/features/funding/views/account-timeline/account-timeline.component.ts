import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { AmountComponent } from '../../../../shared/components/amount/amount.component';
import { FundingApiService } from '../../services/funding-api.service';
import { AccountCycle } from '../../models/cycle';
import { PayoutRequest } from '../../models/payout';
import { AccountStateSnapshot } from '../../models/snapshot';
import { DailyAccountStatus } from '../../models/daily-status';
import { OperationalState, STATE_LABELS } from '../../models/operational-state';

@Component({
  selector: 'app-account-timeline',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe, AmountComponent, FormsModule, RouterLink,
    TableModule, TagModule, CardModule, ButtonModule, DialogModule,
    InputNumberModule, DatePickerModule, ToastModule,
    ProgressBarModule, ProgressSpinnerModule, PageLayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <app-page-layout
      [title]="pageTitle()"
      subtitle="Seguimiento de payouts e historial diario">

      <div actions class="flex items-center gap-2">
        <a routerLink="/funding" class="text-primary text-sm hover:underline">
          <i class="pi pi-arrow-left mr-1"></i>Overview
        </a>
        @if (canRequestPayout()) {
          <p-button
            label="Solicitar Payout"
            icon="pi pi-dollar"
            severity="success"
            size="small"
            [rounded]="true"
            (onClick)="openPayoutDialog()"
          />
        }
      </div>

      @if (snapshot(); as snap) {
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <p-card>
            <div class="text-xs text-gray-500">Estado</div>
            <div class="mt-1">
              <p-tag [value]="stateLabel(snap.operationalState)"
                     [severity]="stateSeverity(snap.operationalState)" />
            </div>
          </p-card>
          <p-card>
            <div class="text-xs text-gray-500">Balance</div>
            <div class="text-lg font-bold"><app-amount [value]="snap.balance" currency="USD" /></div>
          </p-card>
          <p-card>
            <div class="text-xs text-gray-500">Balance Inicial</div>
            <div class="text-lg font-bold"><app-amount [value]="snap.cycleStartBalance" currency="USD" /></div>
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

      <!-- Active Payout Period (PrimeNG Card, theme-aware for light/dark) -->
      @if (activeCycle(); as active) {
        <h3 class="text-lg font-semibold mb-3">Periodo de Payout Actual</h3>
        <p-card class="mb-6 payout-period-card"
                [styleClass]="targetReached() ? 'payout-period-card--target-reached' : ''">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="flex w-8 h-8 items-center justify-center rounded-full shrink-0"
                    [class.bg-primary]="!targetReached()"
                    [class.bg-green-500]="targetReached()">
                @if (targetReached()) {
                  <i class="pi pi-check text-xs text-white"></i>
                } @else {
                  <i class="pi pi-play text-xs text-white"></i>
                }
              </span>
              <div>
                <span class="text-sm font-semibold">Desde {{ active.startDate | date:'mediumDate' }}</span>
                @if (targetReached()) {
                  <p-tag value="Target alcanzado" severity="success" class="ml-2" />
                } @else {
                  <p-tag value="En curso" severity="info" class="ml-2" />
                }
              </div>
            </div>
            <p-button
              label="Editar target"
              icon="pi pi-pencil"
              [text]="true"
              size="small"
              severity="secondary"
              (onClick)="openEditCycleTarget(active)"
            />
          </div>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Balance inicio</div>
              <div class="text-base font-bold"><app-amount [value]="active.cycleStartBalance" currency="USD" /></div>
            </div>
            <div>
              <div class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Ganancia actual</div>
              <div class="text-base font-bold" [class.text-green-500]="profitAmount() > 0" [class.text-red-500]="profitAmount() < 0">
                <app-amount [value]="profitAmount()" currency="USD" digitsInfo="1.2-2" [showPlus]="true" />
              </div>
            </div>
            <div>
              <div class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Target</div>
              <div class="text-base font-bold">
                <app-amount [value]="targetAmount()" currency="USD" digitsInfo="1.0-0" />
                <span class="text-xs text-[var(--text-muted)] font-normal">({{ active.profitTargetPct | number:'1.0-1' }}%)</span>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              @if (targetReached()) {
                <span class="text-[10px] uppercase tracking-wide font-semibold text-green-500">
                  <i class="pi pi-check-circle text-[10px] mr-1"></i>Target alcanzado
                </span>
              } @else {
                <span class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Progreso hacia target</span>
              }
              <span class="text-xs font-semibold"
                    [class.text-green-500]="targetReached()"
                    [class.text-amber-500]="!targetReached() && cycleProgress() >= 50"
                    [class.text-[var(--text-muted)]]="!targetReached() && cycleProgress() < 50">
                <app-amount [value]="profitAmount()" currency="USD" digitsInfo="1.0-0" [showPlus]="true" /> de <app-amount [value]="targetAmount()" currency="USD" digitsInfo="1.0-0" />
                ({{ cycleProgressClamped() | number:'1.0-0' }}%)
              </span>
            </div>
            <p-progressBar
              [value]="cycleProgressClamped()"
              [showValue]="false"
              [style]="{ height: '8px' }"
            />
          </div>
        </p-card>
      }

      <!-- Closed Payout Periods (history) -->
      @if (closedCycles().length > 0) {
        <h3 class="text-lg font-semibold mb-2">Periodos Anteriores</h3>
        <p class="text-xs text-gray-400 mb-3">Un periodo comienza al abrir la cuenta (o tras un payout) y termina cuando cobras el siguiente.</p>

        <div class="flex flex-col gap-2 mb-6">
          @for (cycle of closedCycles(); track cycle.id) {
            <div class="border border-surface-200 bg-surface-50 rounded-lg p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="flex w-7 h-7 items-center justify-center rounded-full bg-gray-300 text-white shrink-0">
                  <i class="pi pi-check text-[10px]"></i>
                </span>
                <div>
                  <span class="text-xs font-semibold text-gray-700">
                    {{ cycle.startDate | date:'mediumDate' }} → {{ cycle.endDate | date:'mediumDate' }}
                  </span>
                  <div class="flex gap-4 text-xs text-gray-500 mt-0.5">
                    <span>Balance: <strong class="text-gray-700"><app-amount [value]="cycle.cycleStartBalance" currency="USD" /></strong></span>
                    <span>Target: <strong class="text-gray-700">{{ cycle.profitTargetPct | number:'1.0-1' }}%</strong></span>
                    @if (getPayoutForCycle(cycle.id); as payout) {
                      <span>Payout: <strong class="text-green-600"><app-amount [value]="payout.amount" currency="USD" /></strong>
                        @if (payout.status === 'PAID') {
                          <i class="pi pi-check-circle text-green-500 text-[10px] ml-0.5"></i>
                        }
                      </span>
                    }
                  </div>
                </div>
              </div>
              <p-tag value="Cerrado" severity="secondary" />
            </div>
          }
        </div>
      } @else if (!activeCycle()) {
        <p class="text-gray-400 text-sm mb-6">No hay periodos registrados.</p>
      }

      <!-- Daily History -->
      <h3 class="text-lg font-semibold mt-6 mb-4">Historial Diario</h3>
      @if (dailyStatuses().length === 0) {
        <p class="text-gray-400 text-sm">Aún no hay datos de estado diario.</p>
      } @else {
        <div class="bullish-table-container">
          <p-table [value]="dailyStatuses()" [rows]="30" [paginator]="dailyStatuses().length > 30"
                   [size]="'small'"
                   [stripedRows]="true"
                   [rowHover]="true"
                   dataKey="id">
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th class="text-right">PnL</th>
                <th class="text-right">Balance EOD</th>
                <th class="text-center">Trades</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ds>
              <tr>
                <td>{{ ds.date | date:'mediumDate' }}</td>
                <td>
                  <p-tag [value]="stateLabel(ds.operationalState)"
                         [severity]="stateSeverity(ds.operationalState)" />
                </td>
                <td class="text-right"
                    [class.text-green-600]="ds.pnlDay > 0"
                    [class.text-red-500]="ds.pnlDay < 0">
                  <app-amount [value]="ds.pnlDay" currency="USD" digitsInfo="1.2-2" [showPlus]="true" />
                </td>
                <td class="text-right"><app-amount [value]="ds.balanceEod" currency="USD" /></td>
                <td class="text-center">{{ ds.tradesCount }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </app-page-layout>

    <!-- Dialog: Solicitar Payout -->
    <p-dialog
      header="Solicitar Payout"
      [(visible)]="showPayoutDialog"
      [modal]="true"
      [style]="{ width: '400px' }"
      appendTo="body">

      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-gray-600">
          Tu cuenta está en estado <strong>PROFIT</strong>. Puedes solicitar un payout del periodo actual.
        </p>
        <div>
          <label class="form-label text-xs text-gray-500 mb-1 block">Fecha de elegibilidad</label>
          <p-datepicker
            [(ngModel)]="payoutEligibleDate"
            dateFormat="yy-mm-dd"
            [showIcon]="true"
            [minDate]="minPayoutDate"
            appendTo="body"
            styleClass="w-full"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-3">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="showPayoutDialog = false" />
          <p-button label="Solicitar" icon="pi pi-check" [rounded]="true"
                    [loading]="payoutLoading"
                    [disabled]="!payoutEligibleDate"
                    (onClick)="submitPayoutRequest()" />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialog: Editar Profit Target del Periodo -->
    <p-dialog
      header="Editar Profit Target"
      [(visible)]="showCycleTargetDialog"
      [modal]="true"
      [style]="{ width: '360px' }"
      appendTo="body">

      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-gray-600">
          Este porcentaje determina cuándo el estado del periodo cambia a <strong>PROFIT</strong> y puedes solicitar un payout.
        </p>
        <div>
          <label class="form-label text-xs text-gray-500 mb-1 block">Profit Target (%)</label>
          <p-inputNumber
            [(ngModel)]="editCycleTargetPct"
            [min]="0.1"
            [max]="100"
            [minFractionDigits]="1"
            [maxFractionDigits]="2"
            suffix="%"
            styleClass="w-full"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-3">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="showCycleTargetDialog = false" />
          <p-button label="Guardar" icon="pi pi-check" [rounded]="true"
                    [loading]="cycleTargetLoading"
                    (onClick)="saveCycleTarget()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class AccountTimelineComponent implements OnInit {
  private api = inject(FundingApiService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  snapshot = signal<AccountStateSnapshot | null>(null);
  cycles = signal<AccountCycle[]>([]);
  payouts = signal<PayoutRequest[]>([]);
  dailyStatuses = signal<DailyAccountStatus[]>([]);
  pageTitle = signal('Cargando...');
  private accountId = '';

  // Payout dialog
  showPayoutDialog = false;
  payoutEligibleDate: Date | null = null;
  payoutLoading = false;
  minPayoutDate = new Date();

  canRequestPayout = computed(() => {
    const snap = this.snapshot();
    const isProfit = snap?.operationalState === OperationalState.PROFIT;
    const isFunded = snap?.account?.propFirmStatus === 'FUNDED';
    return Boolean(isProfit && isFunded);
  });

  // Split cycles into active (single) and closed (history)
  activeCycle = computed(() => {
    return this.cycles().find(c => c.status === 'ACTIVE') ?? null;
  });

  closedCycles = computed(() => {
    return this.cycles().filter(c => c.status === 'CLOSED');
  });

  // Absolute profit amount (balance - cycleStartBalance)
  profitAmount = computed(() => {
    const snap = this.snapshot();
    if (!snap) return 0;
    return Number(snap.balance) - Number(snap.cycleStartBalance);
  });

  // Target amount in absolute currency based on active cycle
  targetAmount = computed(() => {
    const active = this.activeCycle();
    if (!active) return 0;
    return Number(active.cycleStartBalance) * (Number(active.profitTargetPct) / 100);
  });

  // Whether the target has been reached or exceeded
  targetReached = computed(() => {
    const target = this.targetAmount();
    return target > 0 && this.profitAmount() >= target;
  });

  // Cycle progress: how close the active cycle is to the profit target (0-100+)
  // Note: Prisma Decimals may arrive as strings, so explicit Number() conversion is needed.
  cycleProgress = computed(() => {
    const target = this.targetAmount();
    if (target === 0) return 0;
    const profit = this.profitAmount();
    return (profit / target) * 100;
  });

  cycleProgressClamped = computed(() => {
    return Math.min(100, Math.max(0, this.cycleProgress()));
  });

  // Cycle target edit dialog
  showCycleTargetDialog = false;
  editCycleTargetPct = 2;
  editCycleId = '';
  cycleTargetLoading = false;

  ngOnInit() {
    this.accountId = this.route.snapshot.paramMap.get('accountId') ?? '';
    if (!this.accountId) return;
    this.loadData();
  }

  private loadData() {
    this.api.getAccountSnapshot(this.accountId).subscribe(s => {
      this.snapshot.set(s);
      if (s?.account?.name) {
        this.pageTitle.set(s.account.name);
      }
    });
    this.api.getAccountCycles(this.accountId).subscribe(c => this.cycles.set(c));
    this.api.getPayouts(this.accountId).subscribe(p => this.payouts.set(p));
    this.api.getAccountDailyStatus(this.accountId).subscribe(ds => this.dailyStatuses.set(ds));
  }

  /** Find the payout associated with a specific cycle (for closed periods) */
  getPayoutForCycle(cycleId: string): PayoutRequest | null {
    return this.payouts().find(p => p.cycleId === cycleId) ?? null;
  }

  // --- Payout ---

  openPayoutDialog() {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    this.payoutEligibleDate = today;
    this.showPayoutDialog = true;
  }

  submitPayoutRequest() {
    const snap = this.snapshot();
    const activeCycle = this.cycles().find(c => c.status === 'ACTIVE');
    if (!snap || !activeCycle || !this.payoutEligibleDate) return;

    this.payoutLoading = true;
    const eligibleDate = this.payoutEligibleDate.toISOString().split('T')[0];

    this.api.requestPayout(this.accountId, activeCycle.id, eligibleDate).subscribe({
      next: () => {
        this.payoutLoading = false;
        this.showPayoutDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Payout solicitado', detail: 'Tu solicitud de payout ha sido registrada.' });
        this.loadData();
      },
      error: (err) => {
        this.payoutLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo solicitar el payout.' });
      },
    });
  }

  // --- Cycle Target Edit ---

  openEditCycleTarget(cycle: AccountCycle) {
    this.editCycleId = cycle.id;
    this.editCycleTargetPct = cycle.profitTargetPct;
    this.showCycleTargetDialog = true;
  }

  saveCycleTarget() {
    this.cycleTargetLoading = true;
    this.api.updateCycleProfitTarget(this.editCycleId, this.editCycleTargetPct).subscribe({
      next: () => {
        this.cycleTargetLoading = false;
        this.showCycleTargetDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Profit target actualizado.' });
        // Reload both cycles and snapshot so the progress bar updates
        this.loadData();
      },
      error: () => {
        this.cycleTargetLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el profit target.' });
      },
    });
  }

  // --- Helpers ---

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
      case OperationalState.REST_DAY: return 'secondary';
      default: return 'secondary';
    }
  }
}
