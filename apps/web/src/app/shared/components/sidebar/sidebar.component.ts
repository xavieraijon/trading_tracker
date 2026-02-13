import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { App } from '../../../app';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, PanelMenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  app = inject(App);

  /** Flat items rendered with the custom <ul> template. */
  menuItems = computed(() => [
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
      label: 'Calendario',
      icon: 'pi pi-calendar',
      routerLink: ['/calendar']
    }
  ]);

  /** Collapsible PanelMenu items for the Funding section. */
  fundingMenuItems = computed<MenuItem[]>(() => [
    {
      label: 'Funding',
      icon: 'pi pi-building',
      expanded: true,
      items: [
        {
          label: 'Overview',
          icon: 'pi pi-th-large',
          routerLink: '/funding'
        },
        {
          label: 'Plan del Día',
          icon: 'pi pi-check-square',
          routerLink: '/funding/plan'
        },
        {
          label: 'Payouts',
          icon: 'pi pi-money-bill',
          routerLink: '/funding/payouts'
        },
        {
          label: 'Calendario Económico',
          icon: 'pi pi-calendar-clock',
          routerLink: '/funding/calendar'
        }
      ]
    }
  ]);

}
