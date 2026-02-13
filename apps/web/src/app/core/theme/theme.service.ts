import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app-theme';
const THEME_API = '/api/user-preferences/theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private themeState = signal<ThemeMode>(ThemeService.readStoredTheme());

  theme = this.themeState.asReadonly();

  private static readStoredTheme(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }

  constructor() {
    ThemeService.applyToDocument(this.themeState());
  }

  setTheme(mode: ThemeMode): void {
    this.themeState.set(mode);
    ThemeService.applyToDocument(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    if (this.auth.isAuthenticated()) {
      this.http.put(THEME_API, { theme: mode }).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
  }

  /** Call when user is authenticated to load theme from server and apply. */
  syncFromApi(): void {
    if (!this.auth.isAuthenticated()) return;
    this.http.get<{ theme: string | null }>(THEME_API).pipe(
      catchError(() => of({ theme: null })),
      tap(({ theme }) => {
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          this.themeState.set(theme);
          ThemeService.applyToDocument(theme);
          localStorage.setItem(STORAGE_KEY, theme);
        }
      })
    ).subscribe();
  }

  static applyToDocument(mode: ThemeMode): void {
    const root = document.documentElement;
    if (mode === 'light') {
      root.classList.remove('dark');
      return;
    }
    if (mode === 'dark') {
      root.classList.add('dark');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    root.classList.toggle('dark', mq.matches);
  }
}
