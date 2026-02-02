import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterStore {
  // null means "All Accounts" (Global view)
  selectedAccountId = signal<string | null>(null);

  setAccount(accountId: string | null) {
    this.selectedAccountId.set(accountId);
  }
}
