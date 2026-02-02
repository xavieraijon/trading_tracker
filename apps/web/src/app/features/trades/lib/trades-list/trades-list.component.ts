import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TradesService, Trade } from '../../trades.service';
import { TradeFormDialogComponent } from '../trade-form/trade-form.component';

@Component({
  selector: 'app-trades-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TradeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trades-list.component.html',
  styleUrl: './trades-list.component.scss'
})
export class TradesListComponent implements OnInit {
  trades = signal<Trade[]>([]);
  loading: boolean = true;
  tradeDialog: boolean = false;
  selectedTrade: Trade | null = null;

  private tradesService = inject(TradesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit() {
    this.loadTrades();
  }

  loadTrades() {
    this.loading = true;
    this.tradesService.findAll().subscribe({
      next: (data) => {
        this.trades.set(data);
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load trades' });
        this.loading = false;
      }
    });
  }

  openNew() {
    this.selectedTrade = null;
    this.tradeDialog = true;
  }

  editTrade(trade: Trade) {
    this.selectedTrade = { ...trade };
    this.tradeDialog = true;
  }

  onSave() {
    this.loadTrades();
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación guardada' });
  }

  exportTrades() {
    this.tradesService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades_export_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  hideDialog() {
    this.tradeDialog = false;
  }

  getSideSeverity(side: string) {
    return side === 'LONG' ? 'success' : 'danger';
  }

  deleteTrade(trade: Trade) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de borrar la operación en ${trade.instrument}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.tradesService.remove(trade.id).subscribe({
          next: () => {
            this.trades.set(this.trades().filter((t: Trade) => t.id !== trade.id));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación eliminada' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
        });
      }
    });
  }
}
