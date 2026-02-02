import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TradesService, Trade } from '../../trades.service';
import { TradeFormDialogComponent } from '../trade-form/trade-form.component';
import { AccountsService, Account } from '../../../accounts/accounts.service';

@Component({
  selector: 'app-trades-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    DialogModule,
    SelectModule,
    TradeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trades-list.component.html',
  styleUrl: './trades-list.component.scss'
})
export class TradesListComponent implements OnInit {
  trades = signal<Trade[]>([]);
  accounts = signal<Account[]>([]);
  loading: boolean = true;
  tradeDialog: boolean = false;
  importDialog: boolean = false;
  selectedTrade: Trade | null = null;

  importAccountId: string = '';
  importFile: File | null = null;

  private tradesService = inject(TradesService);
  private accountsService = inject(AccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit() {
    this.loadTrades();
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountsService.findAll().subscribe(data => this.accounts.set(data));
  }

  onMt5Upload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.importFile = file;
      this.importDialog = true;
      // Auto-select first account if only one
      if (this.accounts().length === 1) {
        this.importAccountId = this.accounts()[0].id;
      }
    }
  }

  confirmImport() {
    if (!this.importAccountId || !this.importFile) return;

    this.loading = true;
    this.tradesService.importMt5(this.importAccountId, this.importFile).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Importación Completada',
          detail: `Se han importado ${res.imported} operaciones (${res.skipped} duplicadas)`
        });
        this.importDialog = false;
        this.loadTrades();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al importar archivo' });
        this.loading = false;
      }
    });
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
