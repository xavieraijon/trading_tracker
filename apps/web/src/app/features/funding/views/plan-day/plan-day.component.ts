import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FundingApiService } from '../../services/funding-api.service';
import { PlanDayResult } from '../../models/plan-day';
import { STATE_LABELS, STATE_COLORS, OperationalState } from '../../models/operational-state';

@Component({
  selector: 'app-plan-day',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="p-4 flex flex-col gap-6 max-w-2xl mx-auto">
      <h2 class="text-xl font-bold">Plan del Día</h2>

      @if (loading()) {
        <div class="text-gray-400 text-center py-8">Loading...</div>
      } @else if (plan(); as p) {
        <div class="text-sm text-gray-500 mb-2">{{ p.date | date:'fullDate' }}</div>

        @if (p.calendarBlocked) {
          <div class="bg-orange-100 border border-orange-300 text-orange-800 rounded-lg p-4 text-center font-semibold">
            Calendar blocked — No trading today
          </div>
        }

        @if (p.operate.length > 0) {
          <div>
            <h3 class="text-base font-semibold text-green-700 mb-2">Operate Today</h3>
            @for (a of p.operate; track a.accountId) {
              <div class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-2">
                <div>
                  <span class="font-semibold">{{ a.accountName }}</span>
                  <span class="ml-2 text-xs px-1.5 py-0.5 rounded font-bold text-white"
                        [style.background-color]="stateColor(a.state)">
                    {{ stateLabel(a.state) }}
                  </span>
                </div>
                <span class="text-xs text-gray-600">{{ a.reason }}</span>
              </div>
            }
          </div>
        }

        @if (p.block.length > 0) {
          <div>
            <h3 class="text-base font-semibold text-red-700 mb-2">Blocked</h3>
            @for (a of p.block; track a.accountId) {
              <div class="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-2">
                <div>
                  <span class="font-semibold">{{ a.accountName }}</span>
                  <span class="ml-2 text-xs px-1.5 py-0.5 rounded font-bold text-white"
                        [style.background-color]="stateColor(a.state)">
                    {{ stateLabel(a.state) }}
                  </span>
                </div>
                <span class="text-xs text-gray-600">{{ a.reason }}</span>
              </div>
            }
          </div>
        }

        @if (p.operate.length === 0 && !p.calendarBlocked) {
          <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center text-gray-600">
            No funded accounts available to trade today.
          </div>
        }
      }
    </div>
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

  stateColor(state: OperationalState): string {
    return STATE_COLORS[state] ?? '#9CA3AF';
  }
}
