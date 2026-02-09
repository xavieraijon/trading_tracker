import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FormsModule } from '@angular/forms';
import { AccountsService, Account } from '../../accounts.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';
import { FilterToolbarComponent } from '../../../../shared/components/filter-toolbar/filter-toolbar.component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    AccountDialogComponent,
    PageLayoutComponent,
    FilterToolbarComponent,
    IftaLabelModule,
    SelectModule,
    InputTextModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss'
})
export class AccountsListComponent implements OnInit {
  selectedAccounts = signal<Account[] | null>(null);
  accountDialog = signal(false);
  account: Account | null = null;

  // Filtros
  searchTerm = signal('');
  selectedMarket = signal<string | null>(null);
  selectedType = signal<string | null>(null);
  selectedCurrency = signal<string | null>(null);

  private accountsService = inject(AccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit() {
    this.loadAccounts();
  }

  accounts = this.accountsService.accounts;

  filteredAccounts = computed(() => {
    const list = this.accounts();
    const search = this.searchTerm().toLowerCase();
    const market = this.selectedMarket();
    const type = this.selectedType();
    const currency = this.selectedCurrency();

    return list.filter(acc => {
      const matchesSearch = !search || acc.name.toLowerCase().includes(search) || (acc.broker && acc.broker.toLowerCase().includes(search));
      const matchesMarket = !market || acc.market === market;
      const matchesType = !type || acc.type === type;
      const matchesCurrency = !currency || acc.currency === currency;
      return matchesSearch && matchesMarket && matchesType && matchesCurrency;
    });
  });

  marketOptions = [
    { label: 'Todos los Mercados', value: null },
    { label: 'CFD', value: 'CFD' },
    { label: 'Futures', value: 'FUTURES' },
    { label: 'Spot', value: 'SPOT' },
    { label: 'Stocks', value: 'STOCKS' },
    { label: 'Crypto', value: 'CRYPTO' }
  ];

  typeOptions = [
    { label: 'Todos los Tipos', value: null },
    { label: 'Capital Propio', value: 'PERSONAL' },
    { label: 'Prop Firm', value: 'PROP_FIRM' }
  ];

  categoryOptions = [
    { label: 'Todas las Categorías', value: null },
    { label: 'Challenge', value: 'CHALLENGE' },
    { label: 'Fondeada', value: 'FUNDED' }
  ];

  currencyOptions = [
    { label: 'Todas las Divisas', value: null },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
    { label: 'JPY', value: 'JPY' }
  ];

  clearFilters() {
    this.searchTerm.set('');
    this.selectedMarket.set(null);
    this.selectedType.set(null);
    this.selectedCurrency.set(null);
  }

  loadAccounts() {
    this.accountsService.load();
  }

  openNew() {
    this.account = null;
    this.accountDialog.set(true);
  }

  editAccount(account: Account) {
    this.account = { ...account };
    this.accountDialog.set(true);
  }

  deleteAccount(account: Account) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de borrar la cuenta ' + account.name + '? Se eliminarán también todas sus operaciones asociadas de forma permanente.',
      header: 'Confirmar Borrado Permanente',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.accountsService.remove(account.id).subscribe({
            next: () => {
                this.accountsService.load(); // Reloads shared state after deletion
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta eliminada', life: 3000 });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la cuenta' })
        });
      }
    });
  }

  hideDialog() {
    this.accountDialog.set(false);
  }

  onSave() {
    this.accountDialog.set(false);
    this.loadAccounts();
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta guardada', life: 3000 });
  }

  getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PERSONAL': 'Capital Propio',
      'PROP_FIRM': 'Prop Firm / Fondeo'
    };
    return labels[type] || type;
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

  getMarketSeverity(market: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'CFD': 'info',
      'FUTURES': 'contrast',
      'SPOT': 'success',
      'CRYPTO': 'warn',
      'STOCKS': 'secondary'
    };
    return severities[market] || 'secondary';
  }

  getBalanceClass(account: Account): string {
    return account.balance >= account.initialBalance ? 'text-success font-bold' : 'text-danger font-bold';
  }
}
