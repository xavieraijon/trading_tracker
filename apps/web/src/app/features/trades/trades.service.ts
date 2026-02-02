import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  equityCurve: { date: string, equity: number }[];
}

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

  findAll(filters: {
    accountId?: string;
    side?: string;
    instrument?: string;
    daysRange?: number;
    currency?: string;
    accountMarket?: string;
  } = {}): Observable<Trade[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return this.http.get<Trade[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Trade> {
    return this.http.get<Trade>(`${this.apiUrl}/${id}`);
  }

  update(id: string, trade: UpdateTradeDto): Observable<Trade> {
    return this.http.patch<Trade>(`${this.apiUrl}/${id}`, trade);
  }

  getStats(accountId?: string): Observable<TradeStats> {
    const params: any = {};
    if (accountId) params.accountId = accountId;
    return this.http.get<TradeStats>(`${this.apiUrl}/stats`, { params });
  }

  getCalendarStats(accountId?: string): Observable<any[]> {
    const params: any = {};
    if (accountId) params.accountId = accountId;
    return this.http.get<any[]>(`${this.apiUrl}/calendar-stats`, { params });
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
