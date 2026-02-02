import { Routes } from '@angular/router';
import { TradesListComponent } from './lib/trades-list/trades-list.component';

export const TRADES_ROUTES: Routes = [
  {
    path: '',
    component: TradesListComponent
  }
];
