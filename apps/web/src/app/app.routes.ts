import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/lib/lib.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'accounts',
    canActivate: [authGuard],
    loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)
  },
  {
    path: 'trades',
    canActivate: [authGuard],
    loadChildren: () => import('./features/trades/trades.routes').then(m => m.TRADES_ROUTES)
  },
  {
    path: 'funding',
    canActivate: [authGuard],
    loadChildren: () => import('./features/funding/funding.routes').then(m => m.FUNDING_ROUTES)
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./features/analytics/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
