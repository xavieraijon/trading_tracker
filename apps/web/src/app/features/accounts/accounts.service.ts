import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterStore } from '../../core/filter.store';

export type AccountStatus = 'ACTIVE' | 'STANDBY' | 'COMPLETED';

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
  profitTarget?: number | null;
  dailyLossLimit?: number | null;
  maxLossLimit?: number | null;
  startedAt?: string | null;
  status: AccountStatus;
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
  profitTarget?: number | null;
  dailyLossLimit?: number | null;
  maxLossLimit?: number | null;
}
export type UpdateAccountDto = Partial<CreateAccountDto>;

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/accounts';

  accounts = signal<Account[]>([]);
  /** true mientras la petición de cuentas está en curso (login o refresh). */
  accountsLoading = signal<boolean>(false);
  private filterStore = inject(FilterStore);

  /** Only ACTIVE accounts, optionally filtered by category. Used for stats. */
  filteredAccounts = computed(() => {
    const category = this.filterStore.accountCategory();
    const activeAccounts = this.accounts().filter(acc => acc.status === 'ACTIVE');

    if (!category) return activeAccounts;

    return activeAccounts.filter(acc => {
      if (category === 'PERSONAL') return acc.type === 'PERSONAL';

      const isPropFirm = acc.type === 'PROP_FIRM';
      const propStatus = acc.propFirmStatus || 'CHALLENGE';

      if (category === 'CHALLENGE') return isPropFirm && propStatus === 'CHALLENGE';
      if (category === 'FUNDED') return isPropFirm && propStatus === 'FUNDED';

      return true;
    });
  });

  filteredAccountIds = computed(() => {
    const ids = this.filteredAccounts().map(acc => acc.id);
    return ids.length > 0 ? ids : ['__NONE__'];
  });

  /** Accounts grouped by status — used by the accounts-list tabs. */
  activeAccounts = computed(() => this.accounts().filter(a => a.status === 'ACTIVE'));
  standbyAccounts = computed(() => this.accounts().filter(a => a.status === 'STANDBY'));
  completedAccounts = computed(() => this.accounts().filter(a => a.status === 'COMPLETED'));

  constructor() {}

  load() {
    this.accountsLoading.set(true);
    this.findAll().subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.accountsLoading.set(false);
      },
      error: () => this.accountsLoading.set(false)
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

  changeStatus(id: string, status: AccountStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBrokers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/brokers`);
  }
}
