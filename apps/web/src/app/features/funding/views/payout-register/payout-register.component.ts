import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { AmountComponent } from '../../../../shared/components/amount/amount.component';
import { FundingApiService } from '../../services/funding-api.service';
import { PayoutRequest } from '../../models/payout';

@Component({
  selector: 'app-payout-register',
  standalone: true,
  imports: [
    CommonModule, DatePipe, AmountComponent, FormsModule, RouterLink,
    TableModule, TagModule, ButtonModule, SelectButtonModule, DialogModule,
    SelectModule, InputNumberModule, DatePickerModule,
    ToastModule, ConfirmDialogModule, ProgressSpinnerModule, PageLayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog appendTo="body" />

    <app-page-layout
      title="Registro de Payouts"
      subtitle="Historial y estado de tus solicitudes de payout"
      [loading]="loading()">

      <div actions class="flex items-center gap-3">
        <a routerLink="/funding" class="text-primary text-sm hover:underline">
          <i class="pi pi-arrow-left mr-1"></i>Overview
        </a>
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
        <div class="bullish-table-container">
          <p-table [value]="payouts()" [rows]="20" [paginator]="payouts().length > 20"
                   [size]="'small'"
                   [stripedRows]="true"
                   [rowHover]="true"
                   dataKey="id">
            <ng-template pTemplate="header">
              <tr>
                <th>Cuenta</th>
                <th>Solicitado</th>
                <th>Elegible</th>
                <th>Pagado</th>
                <th class="text-right">Monto</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-p>
              <tr>
                <td class="font-medium">{{ p.account?.name ?? p.accountId }}</td>
                <td>{{ p.requestedAt | date:'mediumDate' }}</td>
                <td>{{ p.eligibleDate | date:'mediumDate' }}</td>
                <td>{{ p.paidAt ? (p.paidAt | date:'mediumDate') : '—' }}</td>
                <td class="text-right"><app-amount [value]="p.amount" currency="USD" emptyLabel="—" /></td>
                <td class="text-center">
                  <p-tag [value]="getStatusLabel(p.status)" [severity]="getStatusSeverity(p.status)" />
                </td>
                <td class="text-center">
                  @if (p.status === 'REQUESTED') {
                    <p-button icon="pi pi-arrow-right" size="small" severity="info"
                              [text]="true" [rounded]="true"
                              pTooltip="Marcar en proceso"
                              (onClick)="confirmStatusChange(p, 'PROCESSING')" />
                  }
                  @if (p.status === 'REQUESTED' || p.status === 'PROCESSING') {
                    <p-button icon="pi pi-check-circle" size="small" severity="success"
                              [text]="true" [rounded]="true"
                              pTooltip="Marcar como pagado"
                              (onClick)="openPaidDialog(p)" />
                  }
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center text-gray-400 py-4">No hay payouts con este filtro.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </app-page-layout>

    <!-- Dialog: Marcar como Pagado -->
    <p-dialog
      header="Marcar Payout como Pagado"
      [(visible)]="showPaidDialog"
      [modal]="true"
      [style]="{ width: '400px' }"
      appendTo="body">

      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-gray-600">
          Payout de <strong>{{ selectedPayout?.account?.name }}</strong>
        </p>
        <div>
          <label class="form-label text-xs text-gray-500 mb-1 block">Monto del Payout</label>
          <p-inputNumber
            [(ngModel)]="paidAmount"
            mode="currency"
            currency="USD"
            locale="es-ES"
            placeholder="Monto recibido"
            styleClass="w-full"
          />
        </div>
        <div>
          <label class="form-label text-xs text-gray-500 mb-1 block">Fecha de Pago</label>
          <p-datepicker
            [(ngModel)]="paidDate"
            dateFormat="yy-mm-dd"
            [showIcon]="true"
            appendTo="body"
            styleClass="w-full"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-3">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="showPaidDialog = false" />
          <p-button label="Confirmar Pago" icon="pi pi-check" severity="success" [rounded]="true"
                    [loading]="updateLoading"
                    [disabled]="!paidAmount || !paidDate"
                    (onClick)="submitPaidUpdate()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class PayoutRegisterComponent implements OnInit {
  private api = inject(FundingApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(true);
  payouts = signal<PayoutRequest[]>([]);
  activeTab = '';

  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Solicitado', value: 'REQUESTED' },
    { label: 'Procesando', value: 'PROCESSING' },
    { label: 'Pagado', value: 'PAID' },
  ];

  // Paid dialog
  showPaidDialog = false;
  selectedPayout: PayoutRequest | null = null;
  paidAmount: number | null = null;
  paidDate: Date | null = null;
  updateLoading = false;

  ngOnInit() {
    this.loadPayouts();
  }

  filterByStatus(status: string) {
    this.loadPayouts(status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'REQUESTED': return 'Solicitado';
      case 'PROCESSING': return 'Procesando';
      case 'PAID': return 'Pagado';
      default: return status;
    }
  }

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'secondary' {
    switch (status) {
      case 'REQUESTED': return 'warn';
      case 'PROCESSING': return 'info';
      case 'PAID': return 'success';
      default: return 'secondary';
    }
  }

  // --- Actions ---

  confirmStatusChange(payout: PayoutRequest, newStatus: 'PROCESSING') {
    this.confirmationService.confirm({
      message: `¿Marcar este payout como "En Proceso"?`,
      header: 'Confirmar cambio de estado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.updateLoading = true;
        this.api.updatePayout(payout.id, { status: newStatus }).subscribe({
          next: () => {
            this.updateLoading = false;
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado del payout cambiado a Procesando.' });
            this.loadPayouts(this.activeTab || undefined);
          },
          error: (err) => {
            this.updateLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo actualizar.' });
          },
        });
      },
    });
  }

  openPaidDialog(payout: PayoutRequest) {
    this.selectedPayout = payout;
    this.paidAmount = payout.amount ?? null;
    this.paidDate = new Date();
    this.showPaidDialog = true;
  }

  submitPaidUpdate() {
    if (!this.selectedPayout || !this.paidAmount || !this.paidDate) return;

    this.updateLoading = true;
    const paidAt = this.paidDate.toISOString().split('T')[0];

    this.api.updatePayout(this.selectedPayout.id, {
      status: 'PAID',
      amount: this.paidAmount,
      paidAt,
    }).subscribe({
      next: () => {
        this.updateLoading = false;
        this.showPaidDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Payout Pagado', detail: 'Se ha registrado el pago y se ha iniciado un nuevo ciclo.' });
        this.loadPayouts(this.activeTab || undefined);
      },
      error: (err) => {
        this.updateLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo registrar el pago.' });
      },
    });
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
