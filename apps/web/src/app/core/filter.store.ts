import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterStore {
  // null means "All Accounts" (Global view)
  selectedAccountId = signal<string | null>(null);
  daysRange = signal<number | null>(null); // null = "All Time"
  dateRange = signal<Date[] | null>(null);
  side = signal<string | null>(null);
  instrument = signal<string | null>(null);
  accountMarket = signal<string | null>(null);
  currency = signal<string | null>(null);
  accountCategory = signal<'FUNDED' | 'CHALLENGE' | 'PERSONAL' | null>(null);

  setAccount(accountId: string | null) {
    this.selectedAccountId.set(accountId);
  }

  setAccountCategory(category: 'FUNDED' | 'CHALLENGE' | 'PERSONAL' | null) {
    this.accountCategory.set(category);
    // When changing category, we should reset the selected account as it might not belong to the new category
    this.selectedAccountId.set(null);
  }

  setFilters(filters: {
    daysRange?: number | null;
    dateRange?: Date[] | null;
    side?: string | null;
    instrument?: string | null;
    accountMarket?: string | null;
    currency?: string | null;
  }) {
    if (filters.daysRange !== undefined) this.daysRange.set(filters.daysRange);
    if (filters.dateRange !== undefined) this.dateRange.set(filters.dateRange);
    if (filters.side !== undefined) this.side.set(filters.side);
    if (filters.instrument !== undefined) this.instrument.set(filters.instrument);
    if (filters.accountMarket !== undefined) this.accountMarket.set(filters.accountMarket);
    if (filters.currency !== undefined) this.currency.set(filters.currency);
  }

  resetFilters() {
    this.daysRange.set(null);
    this.dateRange.set(null);
    this.side.set(null);
    this.instrument.set(null);
    this.accountMarket.set(null);
    this.currency.set(null);
  }
}
