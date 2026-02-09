import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FilterStore } from '../../core/filter.store';

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
  initialBalance: number;
  type?: 'PERSONAL' | 'PROP_FIRM';
  market?: 'CFD' | 'FUTURES' | 'SPOT' | 'CRYPTO' | 'STOCKS';
  broker?: string;
  propFirmStatus?: 'CHALLENGE' | 'FUNDED';
  externalId?: string;
  defaultRisk?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  currency: string;
  initialBalance: number;
  type: string;
  market: string;
  broker?: string;
  propFirmStatus?: 'CHALLENGE' | 'FUNDED';
  externalId?: string;
  defaultRisk?: number;
}
export type UpdateAccountDto = Partial<CreateAccountDto>;

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/accounts';

  accounts = signal<Account[]>([]);
  private filterStore = inject(FilterStore);

  filteredAccounts = computed(() => {
    const category = this.filterStore.accountCategory();
    const allAccounts = this.accounts();

    if (!category) return allAccounts;

    return allAccounts.filter(acc => {
      if (category === 'PERSONAL') return acc.type === 'PERSONAL';

      const isPropFirm = acc.type === 'PROP_FIRM';
      const status = acc.propFirmStatus || 'CHALLENGE';

      if (category === 'CHALLENGE') return isPropFirm && status === 'CHALLENGE';
      if (category === 'FUNDED') return isPropFirm && status === 'FUNDED';

      return true;
    });
  });

  filteredAccountIds = computed(() => {
    const ids = this.filteredAccounts().map(acc => acc.id);
    return ids.length > 0 ? ids : ['__NONE__'];
  });

  constructor() {}

  load() {
    this.findAll().subscribe(data => {
      this.accounts.set(data);
    });
  }

  create(account: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, account);
  }

  findAll(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`);
  }

  update(id: string, account: UpdateAccountDto): Observable<Account> {
    return this.http.patch<Account>(`${this.apiUrl}/${id}`, account);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBrokers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/brokers`);
  }
}
