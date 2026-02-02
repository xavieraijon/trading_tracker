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
import { TradesService, Trade } from '../../trades.service';
import { TradeFormDialogComponent } from '../trade-form/trade-form.component';
import { AccountDialogComponent } from '../../../accounts/lib/account-dialog/account-dialog.component';
import { AccountsService, Account } from '../../../accounts/accounts.service';
import { FilterStore } from '../../../../core/filter.store';

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
    SelectButtonModule,
    MultiSelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TradeFormDialogComponent,
    AccountDialogComponent
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
  loading = false;

  // Dialogs
  importDialog = false;
  importAccountId: string | null = null;
  tradeDialog = false;
  accountDialog = false;
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
          const filters = {
              accountId: this.filterStore.selectedAccountId() || undefined,
              daysRange: this.filterStore.daysRange() || undefined,
              side: this.filterStore.side() || undefined,
              instrument: this.filterStore.instrument() || undefined,
              accountMarket: this.filterStore.accountMarket() || undefined,
              currency: this.filterStore.currency() || undefined
          };
          this.loadTrades(filters);
      });
  }

  daysOptions = [
      { label: '30 Días', value: 30 },
      { label: '60 Días', value: 60 },
      { label: '90 Días', value: 90 },
      { label: 'Todo', value: null }
  ];

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

    this.loading = true;
    this.tradesService.importMt5(this.importAccountId || '', this.importFile).subscribe({
      next: (res) => {
        if (res.action === 'REQUIRE_ACCOUNT_CREATION') {
            this.loading = false;
            this.importDialog = false;

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
                    this.accountDialog = true;
                }
            });
            return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Importación Completada',
          detail: `Se han importado ${res.imported} operaciones (${res.skipped} duplicadas)`
        });
        this.importDialog = false;
        this.importAccountId = '';
        this.loadTrades(this.filterStore.selectedAccountId());
      },
      error: (err) => {
        this.loading = false;
        const detail = err.error?.message || 'Error al importar archivo';

        if (detail.includes('No se ha podido detectar')) {
            // Failure to auto-detect -> show manual dialog
            this.importDialog = true;
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
      this.accountDialog = false;

      // If we got the new account, use its ID directly to be sure
      if (newAccount && newAccount.id) {
          this.importAccountId = newAccount.id;
      } else {
          this.importAccountId = ''; // Fallback to auto-detect (which should work now)
      }

      this.confirmImport();
  }

  loadTrades(filters: any = {}) {
    this.loading = true;

    this.tradesService.findAll(filters).subscribe({
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
    // Reload with current filters
    const filters = {
        accountId: this.filterStore.selectedAccountId() || undefined,
        daysRange: this.filterStore.daysRange() || undefined,
        side: this.filterStore.side() || undefined,
        instrument: this.filterStore.instrument() || undefined,
        accountMarket: this.filterStore.accountMarket() || undefined,
        currency: this.filterStore.currency() || undefined
    };
    this.loadTrades(filters);
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación guardada' });
  }

  exportTrades() {
    const accountId = this.filterStore.selectedAccountId() || undefined;
    this.tradesService.exportCsv(accountId).subscribe({
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
