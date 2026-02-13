import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, fromEvent, debounceTime, map, startWith, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  KtdGridModule,
  KtdGridLayout,
} from '@katoid/angular-grid-layout';
import { WidgetHostComponent } from './widgets/widget-host/widget-host.component';
import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardLayoutService } from './services/dashboard-layout.service';
import { WIDGET_DEFINITIONS, getWidgetDefinition } from './models/widget-registry';
import {
  getBreakpointForWidth,
  reflowLayout,
  type GridBreakpoint,
} from './models/responsive-grid.config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageLayoutComponent,
    ProgressSpinnerModule,
    ButtonModule,
    TooltipModule,
    DrawerModule,
    DatePickerModule,
    SelectButtonModule,
    KtdGridModule,
    WidgetHostComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  dataService = inject(DashboardDataService);
  layoutService = inject(DashboardLayoutService);
  private destroy$ = new Subject<void>();

  configPanelVisible = signal(false);
  allWidgets = WIDGET_DEFINITIONS;

  // ── Responsive grid config (signals for zoneless change detection) ──
  private activeBreakpoint = signal<GridBreakpoint>(
    getBreakpointForWidth(typeof window !== 'undefined' ? window.innerWidth : 1400),
  );
  cols = computed(() => this.activeBreakpoint().cols);
  rowHeight = computed(() => this.activeBreakpoint().rowHeight);
  gap = computed(() => this.activeBreakpoint().gap);
  compactType: 'vertical' | 'horizontal' | null = 'vertical';

  /** Whether the current breakpoint is NOT the desktop (xl) one — used to skip persisting */
  private isResponsiveMode = computed(() => this.activeBreakpoint().key !== 'xl');

  /**
   * Local layout array for ktd-grid [layout] binding.
   * ONLY updated on structural changes (load/add/remove/reset) via the effect.
   * NEVER updated from (layoutUpdated) — ktd-grid manages positions internally.
   */
  gridLayout = signal<KtdGridLayout>([]);

  constructor() {
    // Sync gridLayout from the service signal whenever it changes,
    // or when the breakpoint changes — reflow if in responsive mode.
    effect(() => {
      const sourceLayout = this.layoutService.activeWidgets();
      const responsive = this.isResponsiveMode();
      const currentCols = this.cols();
      this.gridLayout.set(
        responsive ? reflowLayout(sourceLayout, currentCols) : sourceLayout,
      );
    });
  }

  ngOnInit(): void {
    this.layoutService.loadLayout();

    // Listen to window resize — emits immediately with current width, then on every resize
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(150),
        map(() => window.innerWidth),
        startWith(window.innerWidth),
        map(width => getBreakpointForWidth(width)),
        distinctUntilChanged((prev, curr) => prev.key === curr.key),
        takeUntil(this.destroy$),
      )
      .subscribe(bp => this.activeBreakpoint.set(bp));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Grid callbacks ──────────────────────────────────────

  /**
   * Called by ktd-grid after drag/resize ends.
   * Only persist — do NOT update the service signal, so the effect won't run and
   * gridLayout stays as-is (ktd-grid already has the correct positions).
   *
   * In responsive mode we skip persistence so the user's desktop layout is preserved.
   */
  onLayoutUpdated(layout: KtdGridLayout): void {
    if (!this.isResponsiveMode()) {
      this.layoutService.persistWithoutSignalUpdate(layout);
    }
  }

  onResizeEnded(): void {
    // Force charts to recalculate their size after resize finishes
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  onRemoveWidget(widgetId: string): void {
    this.layoutService.removeWidget(widgetId);
  }

  // ── Config panel ────────────────────────────────────────

  openConfigPanel(): void {
    this.configPanelVisible.set(true);
  }

  isWidgetActive(widgetId: string): boolean {
    return this.layoutService.activeWidgetIds().has(widgetId);
  }

  toggleWidget(widgetId: string): void {
    if (this.isWidgetActive(widgetId)) {
      this.layoutService.removeWidget(widgetId);
    } else {
      this.layoutService.addWidget(widgetId);
    }
  }

  resetLayout(): void {
    this.layoutService.resetToDefault();
  }

  getWidgetDef(id: string) {
    return getWidgetDefinition(id);
  }
}
