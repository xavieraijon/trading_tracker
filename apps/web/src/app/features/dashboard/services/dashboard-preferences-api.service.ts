import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import type { DashboardLayout } from '../models/widget-registry';

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/user-preferences';

  /** Load dashboard layout from the server */
  loadDashboardLayout(): Observable<DashboardLayout | null> {
    return this.http.get<{ dashboard: DashboardLayout | null }>(`${this.baseUrl}/dashboard`).pipe(
      map(res => res.dashboard ?? null),
      catchError(() => of(null)),
    );
  }

  /** Save dashboard layout to the server */
  saveDashboardLayout(layout: DashboardLayout): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/dashboard`, { dashboard: layout }).pipe(
      catchError(() => of(undefined)),
    );
  }
}
