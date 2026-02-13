import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FundingApiService } from '../../services/funding-api.service';
import { PayoutRequest } from '../../models/payout';

@Component({
  selector: 'app-payout-register',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, TableModule, TagModule, SelectButtonModule, ProgressSpinnerModule, PageLayoutComponent],
  template: `
    <app-page-layout
      title="Registro de Payouts"
      subtitle="Historial y estado de tus solicitudes de payout"
      [loading]="loading()">

      <div actions>
        <p-selectbutton
          [options]="statusOptions"
          [(ngModel)]="activeTab"
          (ngModelChange)="filterByStatus($event)"
          optionLabel="label"
          optionValue="value"
          size="small"
        />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <p-progressSpinner strokeWidth="3" animationDuration="1s" />
        </div>
      } @else if (payouts().length === 0) {
        <div class="text-gray-400 text-center py-8">No se encontraron solicitudes de payout.</div>
      } @else {
        <p-table [value]="payouts()" [rows]="20" [paginator]="payouts().length > 20"
                 styleClass="p-datatable-sm p-datatable-striped"
                 [rowHover]="true">
          <ng-template #header>
            <tr>
              <th>Cuenta</th>
              <th>Solicitado</th>
              <th>Elegible</th>
              <th>Pagado</th>
              <th class="text-right">Monto</th>
              <th class="text-center">Estado</th>
            </tr>
          </ng-template>
          <ng-template #body let-p>
            <tr>
              <td class="font-medium">{{ p.account?.name ?? p.accountId }}</td>
              <td>{{ p.requestedAt | date:'mediumDate' }}</td>
              <td>{{ p.eligibleDate | date:'mediumDate' }}</td>
              <td>{{ p.paidAt ? (p.paidAt | date:'mediumDate') : '—' }}</td>
              <td class="text-right font-mono">{{ p.amount ? (p.amount | currency:'USD') : '—' }}</td>
              <td class="text-center">
                <p-tag [value]="p.status" [severity]="getStatusSeverity(p.status)" />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center text-gray-400 py-4">No hay payouts con este filtro.</td>
            </tr>
          </ng-template>
        </p-table>
      }
    </app-page-layout>
  `,
})
export class PayoutRegisterComponent implements OnInit {
  private api = inject(FundingApiService);

  loading = signal(true);
  payouts = signal<PayoutRequest[]>([]);
  activeTab = '';

  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Solicitado', value: 'REQUESTED' },
    { label: 'Procesando', value: 'PROCESSING' },
    { label: 'Pagado', value: 'PAID' },
  ];

  ngOnInit() {
    this.loadPayouts();
  }

  filterByStatus(status: string) {
    this.loadPayouts(status);
  }

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'secondary' {
    switch (status) {
      case 'REQUESTED': return 'warn';
      case 'PROCESSING': return 'info';
      case 'PAID': return 'success';
      default: return 'secondary';
    }
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
