import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AccountCycle } from '../models/cycle';
import { DailyAccountStatus } from '../models/daily-status';
import { PlanDayResult } from '../models/plan-day';
import { PayoutRequest } from '../models/payout';
import { AccountStateSnapshot } from '../models/snapshot';
import { CalendarEvent } from '../models/calendar-event';

@Injectable({ providedIn: 'root' })
export class FundingApiService {
  private http = inject(HttpClient);
  private base = '/api/funding';

  // --- Snapshots ---
  getSnapshots(): Observable<AccountStateSnapshot[]> {
    return this.http.get<AccountStateSnapshot[]>(`${this.base}/snapshots`);
  }

  getAccountSnapshot(accountId: string): Observable<AccountStateSnapshot> {
    return this.http.get<AccountStateSnapshot>(`${this.base}/accounts/${accountId}/snapshot`);
  }

  // --- Cycles ---
  getAccountCycles(accountId: string): Observable<AccountCycle[]> {
    return this.http.get<AccountCycle[]>(`${this.base}/accounts/${accountId}/cycles`);
  }

  // --- Daily status ---
  getAccountDailyStatus(accountId: string, from?: string, to?: string): Observable<DailyAccountStatus[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<DailyAccountStatus[]>(`${this.base}/accounts/${accountId}/daily-status`, { params });
  }

  getDailyStatusMatrix(accountIds: string[], from?: string, to?: string): Observable<DailyAccountStatus[]> {
    let params = new HttpParams();
    accountIds.forEach(id => params = params.append('accountIds', id));
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<DailyAccountStatus[]>(`${this.base}/daily-status`, { params });
  }

  // --- Plan Day ---
  getPlanDay(date?: string): Observable<PlanDayResult> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<PlanDayResult>(`${this.base}/plan-day`, { params });
  }

  // --- Payouts ---
  getPayouts(accountId?: string, status?: string): Observable<PayoutRequest[]> {
    let params = new HttpParams();
    if (accountId) params = params.set('accountId', accountId);
    if (status) params = params.set('status', status);
    return this.http.get<PayoutRequest[]>(`${this.base}/payouts`, { params });
  }

  requestPayout(accountId: string, cycleId: string, eligibleDate: string): Observable<PayoutRequest> {
    return this.http.post<PayoutRequest>(`${this.base}/payouts`, { accountId, cycleId, eligibleDate });
  }

  updatePayout(id: string, data: { status: string; paidAt?: string; amount?: number }): Observable<PayoutRequest> {
    return this.http.patch<PayoutRequest>(`${this.base}/payouts/${id}`, data);
  }

  // --- Calendar Events ---
  getCalendarEvents(from?: string, to?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<CalendarEvent[]>(`${this.base}/calendar-events`, { params });
  }

  createCalendarEvent(data: { date: string; type: string; label: string; blocksTrading?: boolean }): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${this.base}/calendar-events`, data);
  }

  deleteCalendarEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/calendar-events/${id}`);
  }

  // --- Cycles (update) ---
  updateCycleProfitTarget(cycleId: string, profitTargetPct: number): Observable<AccountCycle> {
    return this.http.patch<AccountCycle>(`${this.base}/cycles/${cycleId}`, { profitTargetPct });
  }

  // --- Rebuild ---
  rebuild(accountId: string, fromDate?: string): Observable<{ daysProcessed: number; cycles: number }> {
    return this.http.post<{ daysProcessed: number; cycles: number }>(`${this.base}/rebuild`, { accountId, fromDate });
  }
}
