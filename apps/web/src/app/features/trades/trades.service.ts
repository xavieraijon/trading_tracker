import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trade {
  id: string;
  accountId: string;
  instrument: string;
  side: 'LONG' | 'SHORT';
  openAt: string;
  closeAt?: string;
  entryPrice?: number;
  exitPrice?: number;
  quantity: number;
  fees: number;
  pnlGross?: number;
  pnlNet: number;
  riskAmount?: number;
  resultR?: number;
  notes?: string;
  account?: {
    name: string;
    currency: string;
  };
}

export type CreateTradeDto = Omit<Trade, 'id' | 'pnlNet' | 'account'>;
export type UpdateTradeDto = Partial<CreateTradeDto>;

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/trades';

  create(trade: CreateTradeDto): Observable<Trade> {
    return this.http.post<Trade>(this.apiUrl, trade);
  }

  findAll(accountId?: string): Observable<Trade[]> {
    let params = new HttpParams();
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.http.get<Trade[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Trade> {
    return this.http.get<Trade>(`${this.apiUrl}/${id}`);
  }

  update(id: string, trade: UpdateTradeDto): Observable<Trade> {
    return this.http.patch<Trade>(`${this.apiUrl}/${id}`, trade);
  }

  getStats(accountId?: string): Observable<any> {
    let params = new HttpParams();
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }

  exportCsv(accountId?: string): Observable<Blob> {
    let params = new HttpParams();
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  importMt5(accountId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);
    return this.http.post<any>(`${this.apiUrl}/import/mt5`, formData);
  }
}
