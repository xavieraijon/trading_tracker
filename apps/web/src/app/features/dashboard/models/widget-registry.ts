import { Type } from '@angular/core';

export type WidgetCategory = 'kpi' | 'chart';

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  defaultCols: number;
  defaultRows: number;
  minCols: number;
  minRows: number;
  maxCols?: number;
  maxRows?: number;
  component?: Type<unknown>;
}

export interface DashboardWidgetItem {
  id: string;
  cols: number;
  rows: number;
  x: number;
  y: number;
}

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
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'winRate',
    name: 'Win Rate',
    description: 'Porcentaje de operaciones ganadoras sobre el total.',
    category: 'kpi',
    icon: 'pi pi-percentage',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'profitFactor',
    name: 'Profit Factor',
    description: 'Relación entre el beneficio bruto y las pérdidas brutas.',
    category: 'kpi',
    icon: 'pi pi-bolt',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'avgWinLoss',
    name: 'Avg W/L',
    description: 'Promedio ganado en trades ganadores vs promedio perdido en perdedores.',
    category: 'kpi',
    icon: 'pi pi-arrows-h',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'maxDrawdown',
    name: 'Max Drawdown',
    description: 'La mayor caída desde un pico en la curva de capital.',
    category: 'kpi',
    icon: 'pi pi-exclamation-triangle',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'totalTrades',
    name: 'Operaciones',
    description: 'Número total de operaciones cerradas en el periodo.',
    category: 'kpi',
    icon: 'pi pi-chart-bar',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'expectancy',
    name: 'Expectancy',
    description: 'Beneficio esperado por operación (promedio ponderado por probabilidad).',
    category: 'kpi',
    icon: 'pi pi-calculator',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'largestWin',
    name: 'Mayor ganancia',
    description: 'La operación ganadora con mayor beneficio.',
    category: 'kpi',
    icon: 'pi pi-arrow-up',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'largestLoss',
    name: 'Mayor pérdida',
    description: 'La operación perdedora con mayor pérdida.',
    category: 'kpi',
    icon: 'pi pi-arrow-down',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },
  {
    id: 'streaks',
    name: 'Rachas',
    description: 'Máximo de operaciones ganadoras o perdedoras consecutivas.',
    category: 'kpi',
    icon: 'pi pi-list',
    defaultCols: 2,
    defaultRows: 2,
    minCols: 2,
    minRows: 2,
    maxCols: 4,
    maxRows: 3,
  },

  // ── Chart Widgets ────────────────────────────────────────
  {
    id: 'equityCurve',
    name: 'Curva de capital',
    description: 'Rendimiento acumulado de la cuenta.',
    category: 'chart',
    icon: 'pi pi-chart-line',
    defaultCols: 12,
    defaultRows: 5,
    minCols: 6,
    minRows: 3,
    maxRows: 8,
  },
  {
    id: 'drawdown',
    name: 'Drawdown',
    description: 'Caída desde el pico máximo de la curva de capital.',
    category: 'chart',
    icon: 'pi pi-chart-line',
    defaultCols: 12,
    defaultRows: 4,
    minCols: 6,
    minRows: 3,
    maxRows: 7,
  },
  {
    id: 'pnlByPeriod',
    name: 'P&L por periodo',
    description: 'Beneficio o pérdida agregada por periodo temporal.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultCols: 12,
    defaultRows: 4,
    minCols: 6,
    minRows: 3,
    maxRows: 7,
  },
  {
    id: 'grossPnlDonut',
    name: 'Beneficio vs Pérdida ($)',
    description: 'Contribución en dólares: ganado vs perdido.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultCols: 4,
    defaultRows: 4,
    minCols: 3,
    minRows: 3,
    maxCols: 6,
    maxRows: 6,
  },
  {
    id: 'longShortDonut',
    name: 'Long vs Short',
    description: 'Distribución de operaciones por dirección.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultCols: 4,
    defaultRows: 4,
    minCols: 3,
    minRows: 3,
    maxCols: 6,
    maxRows: 6,
  },
  {
    id: 'winsLossesDonut',
    name: 'Ganadoras vs Perdedoras',
    description: 'Proporción de trades ganadores y perdedores.',
    category: 'chart',
    icon: 'pi pi-pie-chart',
    defaultCols: 4,
    defaultRows: 4,
    minCols: 3,
    minRows: 3,
    maxCols: 6,
    maxRows: 6,
  },
  {
    id: 'pnlByInstrument',
    name: 'P&L por instrumento',
    description: 'Top 8 activos por contribución al resultado.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultCols: 12,
    defaultRows: 4,
    minCols: 6,
    minRows: 3,
    maxRows: 7,
  },
  {
    id: 'activityByPeriod',
    name: 'Actividad por periodo',
    description: 'Número de operaciones cerradas por periodo temporal.',
    category: 'chart',
    icon: 'pi pi-chart-bar',
    defaultCols: 12,
    defaultRows: 4,
    minCols: 6,
    minRows: 3,
    maxRows: 7,
  },
];

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find(w => w.id === id);
}

export function getDefaultLayout(): DashboardLayout {
  let y = 0;

  const kpis = WIDGET_DEFINITIONS.filter(w => w.category === 'kpi');
  const charts = WIDGET_DEFINITIONS.filter(w => w.category === 'chart');

  const widgets: DashboardWidgetItem[] = [];

  // KPIs: 5 per row, each 2 cols wide (total 10 cols -> we use ~2.4 but gridster rounds, use 2 cols each, 5 per row in a 12-col grid is tricky)
  // With 12 cols and 2 cols each, we fit 6 per row. But original design has 5 per row.
  // To get 5 per row we'd need non-integer cols. Let's keep 2 cols each = 6 per row, or we can adjust.
  // Actually with a 10-col grid or using fractional... Let's keep 12 cols and place KPIs as 2 cols each (6 per row).
  // First row: 5 KPIs (indices 0-4), each 2 cols = 10 cols used, remaining 2 cols empty
  // Second row: 5 KPIs (indices 5-9), each 2 cols = 10 cols used

  // KPI Row 1
  for (let i = 0; i < 5; i++) {
    widgets.push({
      id: kpis[i].id,
      cols: kpis[i].defaultCols,
      rows: kpis[i].defaultRows,
      x: i * 2,
      y,
    });
  }
  y += 2;

  // KPI Row 2
  for (let i = 5; i < 10; i++) {
    widgets.push({
      id: kpis[i].id,
      cols: kpis[i].defaultCols,
      rows: kpis[i].defaultRows,
      x: (i - 5) * 2,
      y,
    });
  }
  y += 2;

  // Charts
  for (const chart of charts) {
    widgets.push({
      id: chart.id,
      cols: chart.defaultCols,
      rows: chart.defaultRows,
      x: 0,
      y,
    });
    y += chart.defaultRows;
  }

  return { version: 1, widgets };
}
