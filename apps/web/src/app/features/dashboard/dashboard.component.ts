import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import {
  KtdGridModule,
  KtdGridLayout,
} from '@katoid/angular-grid-layout';
import { WidgetHostComponent } from './widgets/widget-host/widget-host.component';
import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardLayoutService } from './services/dashboard-layout.service';
import { WIDGET_DEFINITIONS, getWidgetDefinition } from './models/widget-registry';

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
    KtdGridModule,
    WidgetHostComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  dataService = inject(DashboardDataService);
  layoutService = inject(DashboardLayoutService);

  configPanelVisible = signal(false);
  allWidgets = WIDGET_DEFINITIONS;

  // ktd-grid config
  cols = 12;
  rowHeight = 80;
  gap = 10;
  compactType: 'vertical' | 'horizontal' | null = 'vertical';

  /**
   * Local layout array for ktd-grid [layout] binding.
   * ONLY updated on structural changes (load/add/remove/reset) via the effect.
   * NEVER updated from (layoutUpdated) — ktd-grid manages positions internally.
   */
  gridLayout: KtdGridLayout = [];

  constructor() {
    // Sync gridLayout from the service signal whenever it changes.
    // Signal only changes on: loadLayout, addWidget, removeWidget, resetToDefault
    // (NOT on drag/resize — we use persistWithoutSignalUpdate there), so no loop.
    effect(() => {
      this.gridLayout = this.layoutService.activeWidgets();
    });
  }

  ngOnInit(): void {
    this.layoutService.loadLayout();
    // Set initial layout so grid renders before first effect run
    this.gridLayout = this.layoutService.activeWidgets();
  }

  // ── Grid callbacks ──────────────────────────────────────

  /**
   * Called by ktd-grid after drag/resize ends.
   * Only persist — do NOT update the service signal, so the effect won't run and
   * gridLayout stays as-is (ktd-grid already has the correct positions).
   */
  onLayoutUpdated(layout: KtdGridLayout): void {
    this.layoutService.persistWithoutSignalUpdate(layout);
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
