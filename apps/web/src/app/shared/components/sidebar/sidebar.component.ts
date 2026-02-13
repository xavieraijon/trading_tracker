import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { App } from '../../../app';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  app = inject(App);
  fundingExpanded = signal(true);

  menuItems = computed<MenuItem[]>(() => [
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      routerLink: ['/dashboard']
    },
    {
      label: 'Cuentas',
      icon: 'pi pi-wallet',
      routerLink: ['/accounts']
    },
    {
      label: 'Operaciones',
      icon: 'pi pi-briefcase',
      routerLink: ['/trades']
    },
    {
      label: 'Funding',
      icon: 'pi pi-building',
      routerLink: ['/funding'],
      children: [
        {
          label: 'Overview',
          icon: 'pi pi-th-large',
          routerLink: ['/funding']
        },
        {
          label: 'Plan del Día',
          icon: 'pi pi-check-square',
          routerLink: ['/funding/plan']
        },
        {
          label: 'Payouts',
          icon: 'pi pi-money-bill',
          routerLink: ['/funding/payouts']
        },
        {
          label: 'Calendario Econ.',
          icon: 'pi pi-calendar-clock',
          routerLink: ['/funding/calendar']
        }
      ]
    },
    {
      label: 'Calendario',
      icon: 'pi pi-calendar',
      routerLink: ['/calendar']
    }
  ]);

  toggleFunding() {
    this.fundingExpanded.update(v => !v);
  }
}
