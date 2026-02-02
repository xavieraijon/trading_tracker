import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/lib/lib.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'accounts',
    loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)
  },
  {
    path: 'trades',
    loadChildren: () => import('./features/trades/trades.routes').then(m => m.TRADES_ROUTES)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
