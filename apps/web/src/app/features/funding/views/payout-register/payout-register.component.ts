import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FundingApiService } from '../../services/funding-api.service';
import { PayoutRequest } from '../../models/payout';

@Component({
  selector: 'app-payout-register',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-4xl mx-auto">
      <h2 class="text-xl font-bold">Payout Register</h2>

      <!-- Filter tabs -->
      <div class="flex gap-2 text-sm">
        @for (tab of statusTabs; track tab.value) {
          <button (click)="filterByStatus(tab.value)"
                  class="px-3 py-1.5 rounded transition"
                  [class.bg-blue-600]="activeTab() === tab.value"
                  [class.text-white]="activeTab() === tab.value"
                  [class.bg-surface-100]="activeTab() !== tab.value">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="text-gray-400 text-center py-8">Loading...</div>
      } @else if (payouts().length === 0) {
        <div class="text-gray-400 text-center py-8">No payout requests found.</div>
      } @else {
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-surface-100">
              <th class="px-3 py-2 text-left">Account</th>
              <th class="px-3 py-2 text-left">Requested</th>
              <th class="px-3 py-2 text-left">Eligible</th>
              <th class="px-3 py-2 text-left">Paid</th>
              <th class="px-3 py-2 text-right">Amount</th>
              <th class="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (p of payouts(); track p.id) {
              <tr class="border-t border-surface-100 hover:bg-surface-50">
                <td class="px-3 py-2 font-medium">{{ p.account?.name ?? p.accountId }}</td>
                <td class="px-3 py-2">{{ p.requestedAt | date:'mediumDate' }}</td>
                <td class="px-3 py-2">{{ p.eligibleDate | date:'mediumDate' }}</td>
                <td class="px-3 py-2">{{ p.paidAt ? (p.paidAt | date:'mediumDate') : '—' }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ p.amount ? (p.amount | currency:'USD') : '—' }}</td>
                <td class="px-3 py-2 text-center">
                  <span class="text-xs font-bold px-2 py-0.5 rounded"
                        [class.bg-yellow-100]="p.status === 'REQUESTED'"
                        [class.bg-blue-100]="p.status === 'PROCESSING'"
                        [class.bg-green-100]="p.status === 'PAID'">
                    {{ p.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class PayoutRegisterComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  payouts = signal<PayoutRequest[]>([]);
  activeTab = signal<string>('');

  statusTabs = [
    { label: 'All', value: '' },
    { label: 'Requested', value: 'REQUESTED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Paid', value: 'PAID' },
  ];

  ngOnInit() {
    this.loadPayouts();
  }

  filterByStatus(status: string) {
    this.activeTab.set(status);
    this.loadPayouts(status);
  }

  private loadPayouts(status?: string) {
    this.loading.set(true);
    this.api.getPayouts(undefined, status || undefined).subscribe({
      next: ps => {
        this.payouts.set(ps);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
