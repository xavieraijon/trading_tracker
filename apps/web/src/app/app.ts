import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from './core/auth/auth.service';
import { AccountsService } from './features/accounts/accounts.service';
import { FilterStore } from './core/filter.store';

@Component({
  imports: [RouterModule, CommonModule, ButtonModule, MenuModule, AvatarModule, SelectModule, FormsModule, DrawerModule, SelectButtonModule],
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

  categoryOptions = [
    { label: 'Todo', value: null, icon: 'pi pi-globe' },
    { label: 'Fondeada', value: 'FUNDED', icon: 'pi pi-verified' },
    { label: 'Challenge', value: 'CHALLENGE', icon: 'pi pi-trophy' },
    { label: 'Personal', value: 'PERSONAL', icon: 'pi pi-user' }
  ];

  userMenuItems = computed(() => [
    {
        label: 'Todas las Cuentas',
        icon: this.filterStore.accountCategory() === null ? 'pi pi-check text-primary' : 'pi pi-globe',
        command: () => this.onCategoryChange(null)
    },
    {
        label: 'Prop Firm - Fondeada',
        icon: this.filterStore.accountCategory() === 'FUNDED' ? 'pi pi-check text-blue-500' : 'pi pi-verified',
        command: () => this.onCategoryChange('FUNDED')
    },
    {
        label: 'Prop Firm - Challenge',
        icon: this.filterStore.accountCategory() === 'CHALLENGE' ? 'pi pi-check text-amber-500' : 'pi pi-trophy',
        command: () => this.onCategoryChange('CHALLENGE')
    },
    {
        label: 'Capital Propio',
        icon: this.filterStore.accountCategory() === 'PERSONAL' ? 'pi pi-check text-secondary' : 'pi pi-user',
        command: () => this.onCategoryChange('PERSONAL')
    },
    { separator: true },
    { label: 'Mi Perfil', icon: 'pi pi-user' },
    { label: 'Ajustes', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-power-off', command: () => this.logout() }
  ]);

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

  onCategoryChange(category: 'FUNDED' | 'CHALLENGE' | 'PERSONAL' | null) {
    this.filterStore.setAccountCategory(category);
    this.selectedAccountValue.set(null);
    this.onAccountChange(); // Ensure signals are updated
  }

  logout() {
    this.authService.logout();
  }
}
