import { Type } from '@angular/core';
import { KtdGridLayoutItem } from '@katoid/angular-grid-layout';

export type WidgetCategory = 'kpi' | 'chart';

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  component?: Type<unknown>;
}

/** Layout item stored/persisted — compatible with KtdGridLayoutItem */
export type DashboardWidgetItem = KtdGridLayoutItem;

export interface DashboardLayout {
  version: number;
  widgets: DashboardWidgetItem[];
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // ── KPI Widgets ──────────────────────────────────────────
  {
    id: 'netProfit',
    name: 'Net Profit',
    description: 'Beneficio total neto después de todas las operaciones cerradas.',
    category: 'kpi',
    icon: 'pi pi-dollar',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'winRate',
    name: 'Win Rate',
    description: 'Porcentaje de operaciones ganadoras sobre el total.',
    category: 'kpi',
    icon: 'pi pi-percentage',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'profitFactor',
    name: 'Profit Factor',
    description: 'Relación entre el beneficio bruto y las pérdidas brutas.',
    category: 'kpi',
    icon: 'pi pi-bolt',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'avgWinLoss',
    name: 'Avg W/L',
    description: 'Promedio ganado en trades ganadores vs promedio perdido en perdedores.',
    category: 'kpi',
    icon: 'pi pi-arrows-h',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'maxDrawdown',
    name: 'Max Drawdown',
    description: 'La mayor caída desde un pico en la curva de capital.',
    category: 'kpi',
    icon: 'pi pi-exclamation-triangle',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'totalTrades',
    name: 'Operaciones',
    description: 'Número total de operaciones cerradas en el periodo.',
    category: 'kpi',
    icon: 'pi pi-chart-bar',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'expectancy',
    name: 'Expectancy',
    description: 'Beneficio esperado por operación (promedio ponderado por probabilidad).',
    category: 'kpi',
    icon: 'pi pi-calculator',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'largestWin',
    name: 'Mayor ganancia',
    description: 'La operación ganadora con mayor beneficio.',
    category: 'kpi',
    icon: 'pi pi-arrow-up',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'largestLoss',
    name: 'Mayor pérdida',
    description: 'La operación perdedora con mayor pérdida.',
    category: 'kpi',
    icon: 'pi pi-arrow-down',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },
  {
    id: 'streaks',
    name: 'Rachas',
    description: 'Máximo de operaciones ganadoras o perdedoras consecutivas.',
    category: 'kpi',
    icon: 'pi pi-list',
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 3,
  },

  // ── Chart Widgets ────────────────────────────────────────
  {
    id: 'equityCurve',
    name: 'Curva de capital',
    description: 'Rendimiento acumulado de la cuenta.',
    category: 'chart',
    icon: 'pi pi-chart-line',
    defaultW: 12,
    defaultH: 5,
    minW: 6,
    minH: 3,
    maxH: 8,
  },
  {
    id: 'drawdown',
    name: 'Drawdown',
    description: 'Caída desde el pico máximo de la curva de capital.',
    category: 'chart',
    icon: 'pi pi-chart-line',
    defaultW: 12,
    defaultH: 4,
    minW: 6,
    minH: 3,
    maxH: 7,
  },
  {
    id: 'pnlByPeriod',
    name: 'P&L por periodo',
    description: 'Beneficio o pérdida agregada por periodo temporal.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultW: 12,
    defaultH: 4,
    minW: 6,
    minH: 3,
    maxH: 7,
  },
  {
    id: 'grossPnlDonut',
    name: 'Beneficio vs Pérdida ($)',
    description: 'Contribución en dólares: ganado vs perdido.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 6,
  },
  {
    id: 'longShortDonut',
    name: 'Long vs Short',
    description: 'Distribución de operaciones por dirección.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 6,
  },
  {
    id: 'winsLossesDonut',
    name: 'Ganadoras vs Perdedoras',
    description: 'Proporción de trades ganadores y perdedores.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 6,
  },
  {
    id: 'pnlByInstrument',
    name: 'P&L por instrumento',
    description: 'Top 8 activos por contribución al resultado.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultW: 12,
    defaultH: 4,
    minW: 6,
    minH: 3,
    maxH: 7,
  },
  {
    id: 'activityByPeriod',
    name: 'Actividad por periodo',
    description: 'Número de operaciones cerradas por periodo temporal.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultW: 12,
    defaultH: 4,
    minW: 6,
    minH: 3,
    maxH: 7,
  },
];

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find(w => w.id === id);
}

/** Create a widget item from a definition */
export function createWidgetItem(def: WidgetDefinition, x: number, y: number): DashboardWidgetItem {
  return {
    id: def.id,
    x,
    y,
    w: def.defaultW,
    h: def.defaultH,
    minW: def.minW,
    minH: def.minH,
    maxW: def.maxW,
    maxH: def.maxH,
  };
}

/** Re-apply min/max constraints from definitions (lost in JSON serialization) */
export function hydrateWidgetConstraints(widget: DashboardWidgetItem): DashboardWidgetItem {
  const def = getWidgetDefinition(widget.id);
  if (!def) return widget;
  return {
    ...widget,
    minW: def.minW,
    minH: def.minH,
    maxW: def.maxW,
    maxH: def.maxH,
  };
}

export function getDefaultLayout(): DashboardLayout {
  let y = 0;

  const kpis = WIDGET_DEFINITIONS.filter(w => w.category === 'kpi');
  const charts = WIDGET_DEFINITIONS.filter(w => w.category === 'chart');

  const widgets: DashboardWidgetItem[] = [];

  // KPI Row 1: 5 KPIs x 2 cols each
  for (let i = 0; i < 5; i++) {
    widgets.push(createWidgetItem(kpis[i], i * 2, y));
  }
  y += 2;

  // KPI Row 2: 5 KPIs x 2 cols each
  for (let i = 5; i < 10; i++) {
    widgets.push(createWidgetItem(kpis[i], (i - 5) * 2, y));
  }
  y += 2;

  // Charts stacked
  for (const chart of charts) {
    widgets.push(createWidgetItem(chart, 0, y));
    y += chart.defaultH;
  }

  return { version: 1, widgets };
}
