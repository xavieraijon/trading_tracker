import { Injectable, signal, computed, inject } from '@angular/core';
import {
  type DashboardLayout,
  type DashboardWidgetItem,
  WIDGET_DEFINITIONS,
  getDefaultLayout,
  getWidgetDefinition,
} from '../models/widget-registry';
import { DashboardPreferencesApiService } from './dashboard-preferences-api.service';
import { Subject, debounceTime } from 'rxjs';

const STORAGE_KEY = 'dashboard_layout_v1';

@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  private preferencesApi = inject(DashboardPreferencesApiService);

  // ── State ──────────────────────────────────────────────
  private layout = signal<DashboardLayout>(getDefaultLayout());
  private saveSubject = new Subject<DashboardLayout>();
  private initialized = false;

  /** Widgets currently active in the grid */
  activeWidgets = computed(() => this.layout().widgets);

  /** Widget IDs currently shown */
  activeWidgetIds = computed(() => new Set(this.layout().widgets.map(w => w.id)));

  /** All available widget definitions */
  allWidgets = WIDGET_DEFINITIONS;

  constructor() {
    // Debounce backend saves to avoid hammering the API on drag/resize
    this.saveSubject.pipe(debounceTime(2000)).subscribe(layout => {
      this.preferencesApi.saveDashboardLayout(layout).subscribe({
        error: (err: unknown) => console.warn('Failed to sync dashboard layout to server:', err),
      });
    });
  }

  // ── Public API ─────────────────────────────────────────

  /** Load layout: first from localStorage (instant), then sync from backend */
  loadLayout(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Try localStorage cache
    const cached = this.loadFromLocalStorage();
    if (cached) {
      this.layout.set(cached);
    }

    // 2. Sync from backend (overwrites localStorage if newer)
    this.preferencesApi.loadDashboardLayout().subscribe({
      next: (serverLayout) => {
        if (serverLayout) {
          this.layout.set(serverLayout);
          this.saveToLocalStorage(serverLayout);
        } else if (!cached) {
          // No server data and no cache -> use default
          const defaultLayout = getDefaultLayout();
          this.layout.set(defaultLayout);
          this.saveToLocalStorage(defaultLayout);
        }
      },
      error: () => {
        // Backend unavailable, use cache or default
        if (!cached) {
          const defaultLayout = getDefaultLayout();
          this.layout.set(defaultLayout);
          this.saveToLocalStorage(defaultLayout);
        }
      },
    });
  }

  /** Update the full widget list (called by gridster on drag/resize) */
  updateWidgets(widgets: DashboardWidgetItem[]): void {
    const newLayout: DashboardLayout = { ...this.layout(), widgets: [...widgets] };
    this.layout.set(newLayout);
    this.persistLayout(newLayout);
  }

  /** Add a widget to the grid */
  addWidget(widgetId: string): void {
    if (this.activeWidgetIds().has(widgetId)) return;

    const def = getWidgetDefinition(widgetId);
    if (!def) return;

    const newWidget: DashboardWidgetItem = {
      id: widgetId,
      cols: def.defaultCols,
      rows: def.defaultRows,
      x: 0,
      y: 0, // gridster will auto-place
    };

    const newLayout: DashboardLayout = {
      ...this.layout(),
      widgets: [...this.layout().widgets, newWidget],
    };
    this.layout.set(newLayout);
    this.persistLayout(newLayout);
  }

  /** Remove a widget from the grid */
  removeWidget(widgetId: string): void {
    const newLayout: DashboardLayout = {
      ...this.layout(),
      widgets: this.layout().widgets.filter(w => w.id !== widgetId),
    };
    this.layout.set(newLayout);
    this.persistLayout(newLayout);
  }

  /** Reset to default layout */
  resetToDefault(): void {
    const defaultLayout = getDefaultLayout();
    this.layout.set(defaultLayout);
    this.persistLayout(defaultLayout);
  }

  // ── Private helpers ────────────────────────────────────

  private persistLayout(layout: DashboardLayout): void {
    this.saveToLocalStorage(layout);
    this.saveSubject.next(layout);
  }

  private saveToLocalStorage(layout: DashboardLayout): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      console.warn('Failed to save dashboard layout to localStorage');
    }
  }

  private loadFromLocalStorage(): DashboardLayout | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DashboardLayout;
      if (parsed && parsed.version && Array.isArray(parsed.widgets)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
}
