import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { Gridster, GridsterItem, type GridsterConfig, type GridsterItemConfig } from 'angular-gridster2';
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
    Gridster,
    GridsterItem,
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

  gridsterOptions: GridsterConfig = {
    gridType: 'verticalFixed',
    compactType: 'compactUp&Left',
    margin: 10,
    outerMargin: true,
    outerMarginTop: 0,
    outerMarginRight: 0,
    outerMarginBottom: 0,
    outerMarginLeft: 0,
    minCols: 12,
    maxCols: 12,
    minRows: 4,
    maxRows: 200,
    defaultItemCols: 2,
    defaultItemRows: 2,
    fixedRowHeight: 80,
    pushItems: true,
    pushResizeItems: true,
    swap: false,
    disablePushOnResize: false,
    pushDirections: { north: true, east: true, south: true, west: true },
    displayGrid: 'onDrag&Resize',
    disableScrollHorizontal: true,
    draggable: {
      enabled: true,
      dragHandleClass: 'widget-host__titlebar',
      ignoreContentClass: 'widget-host__btn',
    },
    resizable: {
      enabled: true,
      handles: { s: true, e: true, se: true },
    },
    itemChangeCallback: (_item: GridsterItemConfig) => {
      this.onGridChange();
    },
    itemResizeCallback: (_item: GridsterItemConfig) => {
      // Force chart redraw on resize
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    },
  };

  ngOnInit(): void {
    this.layoutService.loadLayout();
  }

  // ── Grid callbacks ──────────────────────────────────────

  onGridChange(): void {
    const widgets = this.layoutService.activeWidgets().map(w => ({
      id: w.id,
      cols: w.cols,
      rows: w.rows,
      x: w.x,
      y: w.y,
    }));
    this.layoutService.updateWidgets(widgets);
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
