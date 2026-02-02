import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  balance: number;
  userId: string;
  type?: string;
  market?: string;
}

export interface CreateAccountDto {
  name: string;
  currency: string;
  initialBalance: number;
  type: string;
  market: string;
}
export type UpdateAccountDto = Partial<CreateAccountDto>;

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/accounts';

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
}
