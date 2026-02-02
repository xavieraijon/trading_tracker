import { Routes } from '@angular/router';
import { AccountsListComponent } from './lib/accounts-list/accounts-list.component';

export const ACCOUNTS_ROUTES: Routes = [
  { path: '', component: AccountsListComponent }
];
