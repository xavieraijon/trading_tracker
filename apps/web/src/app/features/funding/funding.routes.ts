import { Routes } from '@angular/router';

export const FUNDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/dashboard-excel/dashboard-excel.component').then(m => m.DashboardExcelComponent),
  },
  {
    path: 'account/:accountId',
    loadComponent: () =>
      import('./views/account-timeline/account-timeline.component').then(m => m.AccountTimelineComponent),
  },
  {
    path: 'plan',
    loadComponent: () =>
      import('./views/plan-day/plan-day.component').then(m => m.PlanDayComponent),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./views/economic-calendar/economic-calendar.component').then(m => m.EconomicCalendarComponent),
  },
  {
    path: 'payouts',
    loadComponent: () =>
      import('./views/payout-register/payout-register.component').then(m => m.PayoutRegisterComponent),
  },
];
