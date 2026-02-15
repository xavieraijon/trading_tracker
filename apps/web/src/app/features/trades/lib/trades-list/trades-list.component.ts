import { Component, inject, OnInit, signal, effect } from '@angular/core';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TradesService, Trade } from '../../trades.service';
import { TradeFormDialogComponent } from '../trade-form/trade-form.component';
import { AccountDialogComponent } from '../../../accounts/lib/account-dialog/account-dialog.component';
import { AccountsService } from '../../../accounts/accounts.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { FilterStore } from '../../../../core/filter.store';
import { FilterToolbarComponent } from '../../../../shared/components/filter-toolbar/filter-toolbar.component';
import { AmountComponent } from '../../../../shared/components/amount/amount.component';

@Component({
  selector: 'app-trades-list',
  standalone: true,
  imports: [
    CommonModule,
    AmountComponent,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    DialogModule,
    SelectModule,
    SelectButtonModule,
    MultiSelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DatePickerModule,
    TradeFormDialogComponent,
    AccountDialogComponent,
    PageLayoutComponent,
    IftaLabelModule,
    FilterToolbarComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trades-list.component.html',
  styleUrl: './trades-list.component.scss'
})
export class TradesListComponent implements OnInit {
  trades = signal<Trade[]>([]);
  accounts = signal<any[]>([]);
  instruments = signal<{label: string, value: string | null}[]>([]);
  markets = signal<{label: string, value: string | null}[]>([]);
  loading = signal(false);

  // Dialogs
  importDialog = signal(false);
  importAccountId: string | null = null;
  tradeDialog = signal(false);
  accountDialog = signal(false);
  selectedAccountForCreation: any = null;
  selectedTrade: Trade | null = null;

  importFile: File | null = null;

  private tradesService = inject(TradesService);
  private accountsService = inject(AccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  public filterStore = inject(FilterStore);

  constructor() {
      effect(() => {
          this.loadTrades(this.currentFilters);
      });
  }

  get currentFilters() {
      const range = this.filterStore.dateRange();
      const startDate = range && range[0] ? range[0].toISOString() : undefined;
      const endDate = range && range[1] ? range[1].toISOString() : undefined;
      const accountId = this.filterStore.selectedAccountId();

      return {
          accountId: accountId || this.accountsService.filteredAccountIds(),
          startDate,
          endDate,
          daysRange: this.filterStore.daysRange() || undefined,
          side: this.filterStore.side() || undefined,
          instrument: this.filterStore.instrument() || undefined,
          accountMarket: this.filterStore.accountMarket() || undefined,
          currency: this.filterStore.currency() || undefined
      };
  }


  sideOptions = [
      { label: 'Cualquiera', value: null },
      { label: 'Long', value: 'LONG' },
      { label: 'Short', value: 'SHORT' }
  ];


  onFilterChange(type: string, value: any) {
      this.filterStore.setFilters({ [type]: value });
  }

  clearFilters() {
      this.filterStore.resetFilters();
  }

  ngOnInit() {
    this.loadAccounts();
    this.loadInstruments();
    this.loadMarkets();
  }

  loadInstruments() {
    this.tradesService.getUniqueInstruments().subscribe(data => {
      const options = [
        { label: 'Todos', value: null },
        ...data.map(i => ({ label: i, value: i }))
      ];
      this.instruments.set(options);
    });
  }

  loadMarkets() {
    this.tradesService.getUniqueMarkets().subscribe(data => {
      const options = [
        { label: 'Cualquiera', value: null },
        ...data.map(m => ({ label: m, value: m }))
      ];
      this.markets.set(options);
    });
  }

  loadAccounts() {
    this.accountsService.load();
  }

  onMt5Upload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.importFile = file;
      this.importAccountId = ''; // Start with auto-detect

      // Attempt auto-import in next tick to avoid NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
      setTimeout(() => {
        this.confirmImport();
      });

      // Reset input so it can be triggered again with same file
      event.target.value = '';
    }
  }

  confirmImport() {
    if (!this.importFile) return;

    this.loading.set(true);
    this.tradesService.importMt5(this.importAccountId || '', this.importFile).subscribe({
      next: (res) => {
        if (res.action === 'REQUIRE_ACCOUNT_CREATION') {
            this.loading.set(false);
            this.importDialog.set(false);

            this.confirmationService.confirm({
                message: `Hemos detectado operaciones de una cuenta nueva: <b>${res.meta.company} (${res.meta.login})</b>. <br><br>¿Quieres crear esta cuenta ahora mismo?`,
                header: 'Nueva Cuenta Detectada',
                icon: 'pi pi-info-circle',
                acceptLabel: 'Sí, Crear Cuenta',
                rejectLabel: 'Cerrar',
                accept: () => {
                    this.selectedAccountForCreation = {
                        name: `${res.meta.company} - ${res.meta.login}`,
                        broker: res.meta.company,
                        externalId: res.meta.login,
                        currency: res.meta.currency,
                        initialBalance: res.meta.balance
                    };
                    this.accountDialog.set(true);
                }
            });
            return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Importación Completada',
          detail: `Se han importado ${res.imported} operaciones (${res.skipped} duplicadas)`
        });
        this.importDialog.set(false);
        this.importAccountId = '';
        this.loadTrades(this.currentFilters);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err.error?.message || 'Error al importar archivo';

        if (detail.includes('No se ha podido detectar')) {
            // Failure to auto-detect -> show manual dialog
            this.importDialog.set(true);
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
        }
      }
    });
  }

  onAccountSaved(newAccount: any) {
      // Refresh accounts list
      this.loadAccounts();
      this.messageService.add({ severity: 'success', summary: 'Cuenta Creada', detail: 'Cuenta asociada correctamente. Importando operaciones...' });

      this.selectedAccountForCreation = null;
      this.accountDialog.set(false);

      // If we got the new account, use its ID directly to be sure
      if (newAccount && newAccount.id) {
          this.importAccountId = newAccount.id;
      } else {
          this.importAccountId = ''; // Fallback to auto-detect (which should work now)
      }

      this.confirmImport();
  }

  loadTrades(filters: any = {}) {
    this.loading.set(true);

    this.tradesService.findAll(filters).subscribe({
      next: (data) => {
        this.trades.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load trades' });
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.selectedTrade = null;
    this.tradeDialog.set(true);
  }

  editTrade(trade: Trade) {
    this.selectedTrade = { ...trade };
    this.tradeDialog.set(true);
  }

  onSave() {
    this.loadTrades(this.currentFilters);
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación guardada' });
  }

  exportTrades() {
    const accountId = this.filterStore.selectedAccountId();
    const idsToExport = accountId || this.accountsService.filteredAccountIds();

    this.tradesService.exportCsv(idsToExport).subscribe({
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
    this.tradeDialog.set(false);
  }

  getSideSeverity(side: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return side === 'LONG' ? 'success' : 'danger';
  }

  getPropFirmStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'CHALLENGE': 'Challenge',
      'FUNDED': 'Fondeada'
    };
    return labels[status] || status;
  }

  getPropFirmStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return status === 'CHALLENGE' ? 'warn' : 'info';
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
