import { Injectable, signal, computed, inject } from '@angular/core';
import { KtdGridLayout } from '@katoid/angular-grid-layout';
import {
  type DashboardLayout,
  type DashboardWidgetItem,
  WIDGET_DEFINITIONS,
  getDefaultLayout,
  getWidgetDefinition,
  createWidgetItem,
  hydrateWidgetConstraints,
} from '../models/widget-registry';
import { DashboardPreferencesApiService } from './dashboard-preferences-api.service';
import { Subject, debounceTime } from 'rxjs';

const STORAGE_KEY = 'dashboard_layout_v2'; // Bumped version for new format

@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  private preferencesApi = inject(DashboardPreferencesApiService);

  // ── State ──────────────────────────────────────────────
  private layout = signal<DashboardLayout>(getDefaultLayout());
  private saveSubject = new Subject<DashboardLayout>();
  private initialized = false;
  /** Tracks the latest persisted layout (from drag/resize) without updating the signal */
  private lastPersistedLayout: DashboardLayout | null = null;

  /** Widgets currently active in the grid (as KtdGridLayout) */
  activeWidgets = computed<KtdGridLayout>(() => this.layout().widgets);

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
      this.layout.set(this.hydrateLayout(cached));
    }

    // 2. Sync from backend (overwrites localStorage if newer)
    this.preferencesApi.loadDashboardLayout().subscribe({
      next: (serverLayout) => {
        if (serverLayout) {
          const hydrated = this.hydrateLayout(serverLayout);
          this.layout.set(hydrated);
          this.saveToLocalStorage(hydrated);
        } else if (!cached) {
          const defaultLayout = getDefaultLayout();
          this.layout.set(defaultLayout);
          this.saveToLocalStorage(defaultLayout);
        }
      },
      error: () => {
        if (!cached) {
          const defaultLayout = getDefaultLayout();
          this.layout.set(defaultLayout);
          this.saveToLocalStorage(defaultLayout);
        }
      },
    });
  }

  /**
   * Persist layout from ktd-grid drag/resize WITHOUT updating the signal.
   * This avoids the infinite loop: layoutUpdated -> signal change -> [layout] input change -> layoutUpdated.
   * The signal is NOT updated here — ktd-grid already has the correct positions internally.
   * The signal will be correct on next load (from localStorage) or on structural changes.
   */
  persistWithoutSignalUpdate(updatedLayout: KtdGridLayout): void {
    const widgets: DashboardWidgetItem[] = updatedLayout.map(item => {
      const existing = this.layout().widgets.find(w => w.id === item.id);
      return {
        ...item,
        minW: existing?.minW ?? item.minW,
        minH: existing?.minH ?? item.minH,
        maxW: existing?.maxW ?? item.maxW,
        maxH: existing?.maxH ?? item.maxH,
      };
    });

    const persistedLayout: DashboardLayout = { ...this.layout(), widgets };
    // Store latest state for persistence only — DO NOT call layout.set() to avoid feedback loop
    this.lastPersistedLayout = persistedLayout;
    this.saveToLocalStorage(persistedLayout);
    this.saveSubject.next(persistedLayout);
  }

  /** Get the most up-to-date layout (persisted positions take priority) */
  private currentLayout(): DashboardLayout {
    return this.lastPersistedLayout ?? this.layout();
  }

  /** Add a widget to the grid */
  addWidget(widgetId: string): void {
    if (this.activeWidgetIds().has(widgetId)) return;

    const def = getWidgetDefinition(widgetId);
    if (!def) return;

    const newWidget = createWidgetItem(def, 0, 0);
    const current = this.currentLayout();

    const newLayout: DashboardLayout = {
      ...current,
      widgets: [...current.widgets, newWidget],
    };
    this.lastPersistedLayout = null;
    this.layout.set(newLayout);
    this.persistLayout(newLayout);
  }

  /** Remove a widget from the grid */
  removeWidget(widgetId: string): void {
    const current = this.currentLayout();

    const newLayout: DashboardLayout = {
      ...current,
      widgets: current.widgets.filter(w => w.id !== widgetId),
    };
    this.lastPersistedLayout = null;
    this.layout.set(newLayout);
    this.persistLayout(newLayout);
  }

  /** Reset to default layout */
  resetToDefault(): void {
    const defaultLayout = getDefaultLayout();
    this.lastPersistedLayout = null;
    this.layout.set(defaultLayout);
    this.persistLayout(defaultLayout);
  }

  // ── Private helpers ────────────────────────────────────

  /** Re-apply min/max constraints from widget definitions (lost during JSON serialization) */
  private hydrateLayout(layout: DashboardLayout): DashboardLayout {
    return {
      ...layout,
      widgets: layout.widgets.map(hydrateWidgetConstraints),
    };
  }

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
      // Validate basic structure and ensure it uses the new w/h format
      if (parsed && parsed.version && Array.isArray(parsed.widgets) && parsed.widgets.length > 0) {
        const first = parsed.widgets[0];
        if ('w' in first && 'h' in first) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
