import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AccountsService, Account } from '../../accounts.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToolbarModule, ToastModule, ConfirmDialogModule, AccountDialogComponent, PageLayoutComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss'
})
export class AccountsListComponent implements OnInit {
  selectedAccounts = signal<Account[] | null>(null);
  accountDialog = signal(false);
  account: Account | null = null;

  private accountsService = inject(AccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit() {
    this.loadAccounts();
  }

  accounts = this.accountsService.accounts;

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

  getMarketBadgeClass(market: string): string {
    const classes: Record<string, string> = {
      'CFD': 'badge-cfd',
      'FUTURES': 'badge-futures',
      'SPOT': 'badge-spot',
      'CRYPTO': 'badge-crypto',
      'STOCKS': 'badge-stocks'
    };
    return classes[market] || 'badge-neutral';
  }

  getBalanceClass(account: Account): string {
    return account.balance >= account.initialBalance ? 'text-success font-bold' : 'text-danger font-bold';
  }
}
