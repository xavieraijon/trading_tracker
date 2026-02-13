import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { DrawerModule } from 'primeng/drawer';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/auth/auth.service';
import { AccountsService, type Account } from './features/accounts/accounts.service';
import { FilterStore } from './core/filter.store';
import { ThemeService, type ThemeMode } from './core/theme/theme.service';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    SelectModule,
    SelectButtonModule,
    TagModule,
    DrawerModule,
    FormsModule,
    SidebarComponent
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  authService = inject(AuthService);
  accountsService = inject(AccountsService);
  filterStore = inject(FilterStore);
  themeService = inject(ThemeService);
  private router = inject(Router);

  constructor() {
    // Cargar cuentas cuando el usuario esté autenticado (login o refresh con token).
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.accountsService.load();
        this.themeService.syncFromApi();
      }
    });
  }

  // Detect if current route is an auth page
  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects.includes('/auth/')),
      startWith(this.router.url.includes('/auth/'))
    )
  );

  accounts = this.accountsService.accounts;

  selectedAccountValue = signal<string | null>(null);

  // Layout Signals
  sidebarActive = signal(false);
  sidebarStatic = signal(true);
  mobileMenuVisible = signal(false);


  categoryOptions = [
    { label: 'Todo', value: null, icon: 'pi pi-globe' },
    { label: 'Fondeada', value: 'FUNDED', icon: 'pi pi-verified' },
    { label: 'Challenge', value: 'CHALLENGE', icon: 'pi pi-trophy' },
    { label: 'Personal', value: 'PERSONAL', icon: 'pi pi-user' }
  ];

  userMenuItems = computed(() => {
    const theme = this.themeService.theme();
    const themeIcon = (mode: ThemeMode) =>
      theme === mode ? 'pi pi-check text-primary' : (mode === 'light' ? 'pi pi-sun' : mode === 'dark' ? 'pi pi-moon' : 'pi pi-desktop');
    return [
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
      {
        label: 'Tema',
        icon: 'pi pi-palette',
        items: [
          { label: 'Claro', icon: themeIcon('light'), command: () => this.themeService.setTheme('light') },
          { label: 'Oscuro', icon: themeIcon('dark'), command: () => this.themeService.setTheme('dark') },
          { label: 'Sistema', icon: themeIcon('system'), command: () => this.themeService.setTheme('system') }
        ]
      },
      { separator: true },
      { label: 'Mi Perfil', icon: 'pi pi-user' },
      { label: 'Ajustes', icon: 'pi pi-cog' },
      { separator: true },
      { label: 'Cerrar Sesión', icon: 'pi pi-power-off', command: () => this.logout() }
    ];
  });

  ngOnInit() {
    // Sync with global filter state
    this.selectedAccountValue.set(this.filterStore.selectedAccountId());
  }

  onAccountChange() {
    this.filterStore.setAccount(this.selectedAccountValue());
  }

  onCategoryChange(category: 'FUNDED' | 'CHALLENGE' | 'PERSONAL' | null) {
    this.filterStore.setAccountCategory(category);
    this.selectedAccountValue.set(null);
    this.onAccountChange(); // Ensure signals are updated
  }

  getAccountTypeBadgeLabel(account: Account): string {
    if (account.type === 'PROP_FIRM' && account.propFirmStatus) {
      return account.propFirmStatus === 'CHALLENGE' ? 'Challenge' : 'Fondeada';
    }
    return account.type === 'PERSONAL' ? 'Capital Propio' : (account.type ?? '');
  }

  getAccountTypeBadgeSeverity(account: Account): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (account.type === 'PROP_FIRM' && account.propFirmStatus === 'CHALLENGE') return 'warn';
    if (account.type === 'PROP_FIRM' && account.propFirmStatus === 'FUNDED') return 'info';
    return 'secondary';
  }

  onSidebarToggle() {
    this.sidebarActive.set(!this.sidebarActive());
  }

  containerClass = computed(() => {
    return {
        'layout-sidebar-active': this.sidebarActive(),
        'layout-sidebar-static': this.sidebarStatic(),
        'layout-mobile-active': this.mobileMenuVisible()
    };
  });

  logout() {
    this.authService.logout();
  }
}
