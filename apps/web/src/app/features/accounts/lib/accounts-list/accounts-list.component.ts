import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AccountsService, Account } from '../../accounts.service';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToolbarModule, ToastModule, ConfirmDialogModule, AccountDialogComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss'
})
export class AccountsListComponent implements OnInit {
  accounts = signal<Account[]>([]);
  selectedAccounts: Account[] | null = null;
  accountDialog: boolean = false;
  account: Account | null = null;

  private accountsService = inject(AccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountsService.findAll().subscribe({
      next: (data) => this.accounts.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load accounts' })
    });
  }

  openNew() {
    this.account = null;
    this.accountDialog = true;
  }

  editAccount(account: Account) {
    this.account = { ...account };
    this.accountDialog = true;
  }

  deleteAccount(account: Account) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete ' + account.name + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.accountsService.remove(account.id).subscribe({
            next: () => {
                this.accounts.set(this.accounts().filter((val: Account) => val.id !== account.id));
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Account Deleted', life: 3000 });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete account' })
        });
      }
    });
  }

  hideDialog() {
    this.accountDialog = false;
  }

  onSave() {
    this.accountDialog = false;
    this.loadAccounts();
    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Account Saved', life: 3000 });
  }
}
