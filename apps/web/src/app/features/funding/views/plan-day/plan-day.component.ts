import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { PlanDayResult } from '../../models/plan-day';
import { STATE_LABELS, OperationalState } from '../../models/operational-state';

@Component({
  selector: 'app-plan-day',
  standalone: true,
  imports: [CommonModule, DatePipe, TagModule, MessageModule, CardModule, ProgressSpinnerModule, PageLayoutComponent],
  template: `
    <app-page-layout
      title="Plan del Día"
      subtitle="Priorización de cuentas fondeadas para operar hoy"
      [loading]="loading()">

      @if (loading()) {
        <div class="flex justify-center py-8">
          <p-progressSpinner strokeWidth="3" animationDuration="1s" />
        </div>
      } @else if (plan(); as p) {
        <div class="text-sm text-gray-500 mb-4">{{ p.date | date:'fullDate' }}</div>

        @if (p.calendarBlocked) {
          <p-message severity="warn" icon="pi pi-ban">
            <span class="font-semibold">Calendar blocked — No trading today</span>
          </p-message>
        }

        @if (p.operate.length > 0) {
          <div class="mb-6">
            <h3 class="text-base font-semibold text-green-700 mb-3">Operar Hoy</h3>
            @for (a of p.operate; track a.accountId) {
              <p-card styleClass="mb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ a.accountName }}</span>
                    <p-tag [value]="stateLabel(a.state)" [severity]="stateSeverity(a.state)" />
                  </div>
                  <span class="text-xs text-gray-500">{{ a.reason }}</span>
                </div>
              </p-card>
            }
          </div>
        }

        @if (p.block.length > 0) {
          <div>
            <h3 class="text-base font-semibold text-red-700 mb-3">Bloqueadas</h3>
            @for (a of p.block; track a.accountId) {
              <p-card styleClass="mb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ a.accountName }}</span>
                    <p-tag [value]="stateLabel(a.state)" [severity]="stateSeverity(a.state)" />
                  </div>
                  <span class="text-xs text-gray-500">{{ a.reason }}</span>
                </div>
              </p-card>
            }
          </div>
        }

        @if (p.operate.length === 0 && !p.calendarBlocked) {
          <p-message severity="info" icon="pi pi-info-circle">
            <span>No hay cuentas fondeadas disponibles para operar hoy.</span>
          </p-message>
        }
      }
    </app-page-layout>
  `,
})
export class PlanDayComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  plan = signal<PlanDayResult | null>(null);

  ngOnInit() {
    this.api.getPlanDay().subscribe({
      next: p => {
        this.plan.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
