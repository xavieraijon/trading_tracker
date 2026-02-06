import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from './core/auth/auth.service';
import { AccountsService } from './features/accounts/accounts.service';
import { FilterStore } from './core/filter.store';

@Component({
  imports: [RouterModule, CommonModule, ButtonModule, MenuModule, AvatarModule, SelectModule, FormsModule, DrawerModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  authService = inject(AuthService);
  accountsService = inject(AccountsService);
  filterStore = inject(FilterStore);

  accounts = this.accountsService.accounts;
  selectedAccountValue = signal<string | null>(null);
  mobileMenuVisible = signal(false);

  userMenuItems = [
    { label: 'Mi Perfil', icon: 'pi pi-user' },
    { label: 'Ajustes', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-power-off', command: () => this.logout() }
  ];

  ngOnInit() {
    // Sync with global filter state
    this.selectedAccountValue.set(this.filterStore.selectedAccountId());

    if (this.authService.isAuthenticated()) {
      this.accountsService.load();
    }
  }

  onAccountChange() {
    this.filterStore.setAccount(this.selectedAccountValue());
  }

  logout() {
    this.authService.logout();
  }
}
