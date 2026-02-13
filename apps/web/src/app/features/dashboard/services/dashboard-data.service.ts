import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { TradesService } from '../../trades/trades.service';
import { AccountsService } from '../../accounts/accounts.service';
import { FilterStore } from '../../../core/filter.store';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private tradesService = inject(TradesService);
  private filterStore = inject(FilterStore);
  accountsService = inject(AccountsService);

  // ── Core state ──────────────────────────────────────────
  stats = signal<any>(null);
  /** Global dashboard date range filter (manual picker). When set, all widgets use data within this range. */
  dashboardDateRange = signal<Date[] | null>(null);
  selectedTimeframe = signal<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  loading = signal(false);

  /** Stats derived from current stats filtered by dashboardDateRange. KPIs and charts use this. */
  filteredStats = computed(() => {
    const s = this.stats();
    if (!s?.equityCurve?.length) return s;
    const range = this.dashboardDateRange();
    const curve = !range || range.length < 2 ? s.equityCurve : this.getFilteredCurve(s.equityCurve, range);
    if (curve === s.equityCurve) return s;
    return this.buildStatsFromCurve(curve);
  });

  // ── Chart data signals ──────────────────────────────────
  chartData = signal<any>(null);
  drawdownChartData = signal<any>(null);
  pnlBarChartData = signal<any>(null);
  longShortDonutData = signal<any>(null);
  winsLossesDonutData = signal<any>(null);
  grossPnLDonutData = signal<any>(null);
  pnlByInstrumentBarData = signal<any>(null);
  tradesByPeriodBarData = signal<any>(null);

  // ── Sparklines ──────────────────────────────────────────
  pnlSparkline = signal<any>(null);
  winRateSparkline = signal<any>(null);
  profitFactorSparkline = signal<any>(null);

  // ── Chart options ───────────────────────────────────────
  readonly sparklineOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.6, borderWidth: 1.2, capStyle: 'round' as const },
    },
  };

  readonly chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 2.5,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 16,
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold', family: 'Outfit' },
        bodyFont: { size: 13, family: 'Outfit' },
        displayColors: false,
          callbacks: {
          title: (items: any) => {
            const timeframe = this.selectedTimeframe();
            const index = items[0].dataIndex;
            const stats = this.filteredStats();
            if (timeframe === 'all') {
              const trade = stats.equityCurve[index];
              return `${trade.side === 'LONG' ? '🟩 LONG' : '🟥 SHORT'} - ${trade.instrument}`;
            }
            return `Balance al final del periodo`;
          },
          label: (item: any) => {
            const timeframe = this.selectedTimeframe();
            const index = item.dataIndex;
            const stats = this.filteredStats();
            let dataPoint;
            if (timeframe === 'all') {
              dataPoint = stats.equityCurve[index];
            } else {
              dataPoint = this.aggregateData(stats.equityCurve, timeframe)[index];
            }
            const pnlStr =
              dataPoint.pnl !== undefined
                ? dataPoint.pnl >= 0
                  ? `+$${dataPoint.pnl.toFixed(2)}`
                  : `-$${Math.abs(dataPoint.pnl).toFixed(2)}`
                : 'N/A';
            const lines = [
              `Equidad: $${dataPoint.equity.toFixed(2)}`,
              `Fecha: ${new Date(dataPoint.date).toLocaleDateString()}`,
            ];
            if (timeframe === 'all') {
              lines.unshift(`Resultado: ${pnlStr}`);
              lines.push(`Cuenta: ${dataPoint.accountName}`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          autoSkip: true,
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: { borderDash: [5, 5], color: 'rgba(148, 163, 184, 0.2)', drawTicks: false },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          padding: 10,
          callback: (value: any) => '$' + value,
        },
      },
    },
  };

  readonly drawdownChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 2.2,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 16,
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold', family: 'Outfit' },
        bodyFont: { size: 13, family: 'Outfit' },
        displayColors: false,
        callbacks: {
          label: (item: { raw: number }) =>
            `Drawdown: $${Math.abs(Number(item.raw)).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          autoSkip: true,
          maxRotation: 45,
        },
      },
      y: {
        grid: { borderDash: [5, 5], color: 'rgba(148, 163, 184, 0.2)' },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          padding: 10,
          callback: (value: unknown) => '$' + Math.abs(Number(value)),
        },
      },
    },
  };

  readonly pnlBarChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 2.2,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 16,
        cornerRadius: 12,
        callbacks: {
          label: (item: { raw: number }) => {
            const v = Number(item.raw);
            return `P&L: ${v >= 0 ? '+' : ''}$${v.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, autoSkip: true, maxRotation: 45 },
      },
      y: {
        grid: { borderDash: [5, 5], color: 'rgba(148, 163, 184, 0.2)' },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          padding: 10,
          callback: (value: unknown) => '$' + value,
        },
      },
    },
  };

  readonly donutChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: { label: string; raw: number; dataset: { data: number[] } }) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  readonly donutChartOptionsDollars = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: { label: string; raw: number; dataIndex: number; dataset: { data: number[] } }) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total !== 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
            const isLoss = ctx.dataIndex === 1;
            const amount = isLoss ? `-$${ctx.raw.toFixed(2)}` : `+$${ctx.raw.toFixed(2)}`;
            return `${ctx.label}: ${amount} (${pct}%)`;
          },
        },
      },
    },
  };

  readonly horizontalBarOptions = {
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, callback: (v: unknown) => '$' + v },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } },
      },
    },
  };

  readonly tradesByPeriodBarOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx: { raw: number }) => `Operaciones: ${ctx.raw}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, autoSkip: true, maxRotation: 45 },
      },
      y: {
        grid: { borderDash: [5, 5], color: 'rgba(148, 163, 184, 0.2)' },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, stepSize: 1 },
      },
    },
  };

  readonly timeframeOptions = [
    { label: 'Todos', value: 'all', icon: 'pi pi-list' },
    { label: 'Día', value: 'day', icon: 'pi pi-calendar' },
    { label: 'Semana', value: 'week', icon: 'pi pi-calendar-plus' },
    { label: 'Mes', value: 'month', icon: 'pi pi-calendar-minus' },
    { label: 'Año', value: 'year', icon: 'pi pi-calendar-clock' },
  ];

  constructor() {
    effect(() => {
      this.loadStats();
    });
    effect(() => {
      this.dashboardDateRange();
      this.selectedTimeframe();
      if (this.stats()) this.prepareAllChartData();
    });
  }

  // ── Public API ──────────────────────────────────────────

  onDateRangeChange(range: Date[] | null): void {
    this.dashboardDateRange.set(range ?? null);
  }

  loadStats(): void {
    const accountId = this.filterStore.selectedAccountId();
    const idsToFetch = accountId || this.accountsService.filteredAccountIds();

    if (!idsToFetch || idsToFetch.length === 0 || (Array.isArray(idsToFetch) && idsToFetch[0] === '__NONE__')) {
      this.clearStats();
      return;
    }

    this.loading.set(true);
    this.tradesService.getStats(idsToFetch).subscribe({
      next: (data: any) => {
        if (!data || !data.equityCurve) {
          this.clearStats();
          return;
        }
        this.stats.set(data);
        this.prepareAllChartData();
        this.loading.set(false);
      },
      error: () => {
        this.clearStats();
        this.loading.set(false);
      },
    });
  }

  onTimeframeSelect(value: 'all' | 'day' | 'week' | 'month' | 'year'): void {
    this.selectedTimeframe.set(value);
    this.prepareTimeframeDependentCharts();
  }

  // ── Private helpers ─────────────────────────────────────

  private clearStats(): void {
    this.stats.set(null);
    this.chartData.set(null);
    this.drawdownChartData.set(null);
    this.pnlBarChartData.set(null);
    this.longShortDonutData.set(null);
    this.winsLossesDonutData.set(null);
    this.grossPnLDonutData.set(null);
    this.pnlByInstrumentBarData.set(null);
    this.tradesByPeriodBarData.set(null);
    this.pnlSparkline.set(null);
    this.winRateSparkline.set(null);
    this.profitFactorSparkline.set(null);
    this.loading.set(false);
  }

  private prepareAllChartData(): void {
    const curve = this.filteredStats()?.equityCurve ?? [];
    this.prepareChartData();
    this.prepareDrawdownChartData();
    this.preparePnLBarChartData();
    this.prepareLongShortDonut(curve);
    this.prepareWinsLossesDonut(curve);
    this.prepareGrossPnLDonut(curve);
    this.preparePnlByInstrumentBar(curve);
    this.prepareTradesByPeriodBar(curve);
    this.prepareSparklines(curve);
  }

  private prepareTimeframeDependentCharts(): void {
    this.prepareChartData();
    this.prepareDrawdownChartData();
    this.preparePnLBarChartData();
    this.prepareTradesByPeriodBar(this.filteredStats()?.equityCurve ?? []);
  }

  prepareSparklines(curve: any[]): void {
    if (!curve || curve.length === 0) return;
    const getGradient = (color: string) => (context: any) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      if (!chartArea) return null;
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, `${color}33`);
      gradient.addColorStop(1, `${color}00`);
      return gradient;
    };
    this.pnlSparkline.set({
      labels: curve.map((_: any, i: number) => i),
      datasets: [{ data: curve.map((p: any) => p.equity), borderColor: '#10b981', fill: true, backgroundColor: getGradient('#10b981') }],
    });
    let wins = 0;
    const winRateTrend = curve.map((p: any, i: number) => {
      if (p.pnl > 0) wins++;
      return (wins / (i + 1)) * 100;
    });
    this.winRateSparkline.set({
      labels: curve.map((_: any, i: number) => i),
      datasets: [{ data: winRateTrend, borderColor: '#3b82f6', fill: true, backgroundColor: getGradient('#3b82f6') }],
    });
    let grossProfits = 0;
    let grossLosses = 0;
    const pfTrend = curve.map((p: any) => {
      if (p.pnl > 0) grossProfits += p.pnl;
      else grossLosses += Math.abs(p.pnl);
      return grossLosses === 0 ? 0 : grossProfits / grossLosses;
    });
    this.profitFactorSparkline.set({
      labels: curve.map((_: any, i: number) => i),
      datasets: [{ data: pfTrend, borderColor: '#f59e0b', fill: true, backgroundColor: getGradient('#f59e0b') }],
    });
  }

  prepareChartData(): void {
    const stats = this.filteredStats();
    if (!stats || !stats.equityCurve || stats.equityCurve.length === 0) return;
    let dataPoints = stats.equityCurve;
    const timeframe = this.selectedTimeframe();
    if (timeframe !== 'all') {
      dataPoints = this.aggregateData(stats.equityCurve, timeframe);
    }
    this.chartData.set({
      labels: dataPoints.map((p: any) => {
        const date = new Date(p.date);
        if (timeframe === 'all') return date.toLocaleDateString();
        if (timeframe === 'day') return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        if (timeframe === 'week') return `S${this.getWeekNumber(date)}`;
        if (timeframe === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        if (timeframe === 'year') return date.getFullYear().toString();
        return date.toLocaleDateString();
      }),
      datasets: [
        {
          label: 'Equity',
          data: dataPoints.map((point: any) => point.equity),
          fill: true,
          borderColor: '#059669',
          borderWidth: 3,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            return gradient;
          },
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#059669',
          pointBorderWidth: 2,
          pointRadius: timeframe === 'all' ? 4 : 6,
          pointHoverRadius: 8,
        },
      ],
    });
  }

  prepareDrawdownChartData(): void {
    const stats = this.filteredStats();
    if (!stats?.equityCurve?.length) {
      this.drawdownChartData.set(null);
      return;
    }
    let dataPoints = stats.equityCurve;
    const timeframe = this.selectedTimeframe();
    if (timeframe !== 'all') {
      dataPoints = this.aggregateData(stats.equityCurve, timeframe);
    }
    let peak = 0;
    const drawdowns = dataPoints.map((p: { equity: number }) => {
      const eq = Number(p.equity);
      if (eq > peak) peak = eq;
      return peak - eq;
    });
    this.drawdownChartData.set({
      labels: dataPoints.map((p: { date: string }) => {
        const date = new Date(p.date);
        if (timeframe === 'all') return date.toLocaleDateString();
        if (timeframe === 'day') return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        if (timeframe === 'week') return `S${this.getWeekNumber(date)}`;
        if (timeframe === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        if (timeframe === 'year') return date.getFullYear().toString();
        return date.toLocaleDateString();
      }),
      datasets: [
        {
          label: 'Drawdown',
          data: drawdowns,
          fill: true,
          borderColor: '#ef4444',
          borderWidth: 2,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.4,
          pointRadius: timeframe === 'all' ? 3 : 5,
        },
      ],
    });
  }

  preparePnLBarChartData(): void {
    const stats = this.filteredStats();
    if (!stats?.equityCurve?.length) {
      this.pnlBarChartData.set(null);
      return;
    }
    const timeframe = this.selectedTimeframe();
    if (timeframe === 'all') {
      this.pnlBarChartData.set(null);
      return;
    }
    const curve = stats.equityCurve as { date: string; pnl?: number }[];
    const groups: Record<string, { pnl: number; date: string }> = {};
    curve.forEach(p => {
      const date = new Date(p.date);
      let key: string;
      if (timeframe === 'day') key = date.toISOString().split('T')[0];
      else if (timeframe === 'week') key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      else if (timeframe === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      else key = `${date.getFullYear()}`;
      if (!groups[key]) groups[key] = { pnl: 0, date: p.date };
      groups[key].pnl += Number(p.pnl ?? 0);
    });
    const sorted = Object.entries(groups).sort(([, a], [, b]) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sorted.map(([, v]) => {
      const date = new Date(v.date);
      if (timeframe === 'day') return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      if (timeframe === 'week') return `S${this.getWeekNumber(date)}`;
      if (timeframe === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return date.getFullYear().toString();
    });
    const data = sorted.map(([, v]) => v.pnl);
    this.pnlBarChartData.set({
      labels,
      datasets: [
        {
          label: 'P&L',
          data,
          backgroundColor: data.map((v: number) => (v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)')),
          borderColor: data.map((v: number) => (v >= 0 ? '#059669' : '#dc2626')),
          borderWidth: 1,
        },
      ],
    });
  }

  prepareLongShortDonut(curve: { side?: string }[] | null): void {
    if (!curve?.length) { this.longShortDonutData.set(null); return; }
    const long = curve.filter(p => p.side === 'LONG').length;
    const short = curve.filter(p => p.side === 'SHORT').length;
    if (long === 0 && short === 0) { this.longShortDonutData.set(null); return; }
    this.longShortDonutData.set({
      labels: ['Long', 'Short'],
      datasets: [{ data: [long, short], backgroundColor: ['#10b981', '#6366f1'], borderWidth: 0 }],
    });
  }

  prepareWinsLossesDonut(curve: { pnl?: number }[] | null): void {
    if (!curve?.length) { this.winsLossesDonutData.set(null); return; }
    const wins = curve.filter(p => Number(p.pnl ?? 0) > 0).length;
    const losses = curve.filter(p => Number(p.pnl ?? 0) <= 0).length;
    this.winsLossesDonutData.set({
      labels: ['Ganadoras', 'Perdedoras'],
      datasets: [{ data: [wins, losses], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }],
    });
  }

  prepareGrossPnLDonut(curve: { pnl?: number }[] | null): void {
    if (!curve?.length) { this.grossPnLDonutData.set(null); return; }
    let grossProfit = 0;
    let grossLoss = 0;
    curve.forEach(p => {
      const v = Number(p.pnl ?? 0);
      if (v > 0) grossProfit += v;
      else if (v < 0) grossLoss += Math.abs(v);
    });
    if (grossProfit === 0 && grossLoss === 0) { this.grossPnLDonutData.set(null); return; }
    this.grossPnLDonutData.set({
      labels: ['Beneficio bruto', 'Pérdida bruta'],
      datasets: [{ data: [grossProfit, grossLoss], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }],
    });
  }

  preparePnlByInstrumentBar(curve: { instrument?: string; pnl?: number }[] | null): void {
    if (!curve?.length) { this.pnlByInstrumentBarData.set(null); return; }
    const byInstrument: Record<string, number> = {};
    curve.forEach(p => {
      const name = p.instrument ?? 'Otro';
      byInstrument[name] = (byInstrument[name] ?? 0) + Number(p.pnl ?? 0);
    });
    const sorted = Object.entries(byInstrument).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).slice(0, 8);
    if (sorted.length === 0) { this.pnlByInstrumentBarData.set(null); return; }
    const labels = sorted.map(([k]) => k);
    const data = sorted.map(([, v]) => v);
    this.pnlByInstrumentBarData.set({
      labels,
      datasets: [
        {
          label: 'P&L',
          data,
          backgroundColor: data.map((v: number) => (v >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)')),
          borderColor: data.map((v: number) => (v >= 0 ? '#059669' : '#dc2626')),
          borderWidth: 1,
        },
      ],
    });
  }

  prepareTradesByPeriodBar(curve: { date: string }[] | null): void {
    const timeframe = this.selectedTimeframe();
    if (!curve?.length || timeframe === 'all') { this.tradesByPeriodBarData.set(null); return; }
    const groups: Record<string, number> = {};
    curve.forEach(p => {
      const date = new Date(p.date);
      let key: string;
      if (timeframe === 'day') key = date.toISOString().split('T')[0];
      else if (timeframe === 'week') key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      else if (timeframe === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      else key = `${date.getFullYear()}`;
      groups[key] = (groups[key] ?? 0) + 1;
    });
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    const labels = sorted.map(([key]) => {
      const firstInPeriod = curve.find((x: any) => {
        const d = new Date(x.date);
        let k: string;
        if (timeframe === 'day') k = d.toISOString().split('T')[0];
        else if (timeframe === 'week') k = `${d.getFullYear()}-W${this.getWeekNumber(d)}`;
        else if (timeframe === 'month') k = `${d.getFullYear()}-${d.getMonth() + 1}`;
        else k = `${d.getFullYear()}`;
        return k === key;
      });
      if (!firstInPeriod) return key;
      const date = new Date(firstInPeriod.date);
      if (timeframe === 'day') return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      if (timeframe === 'week') return `S${this.getWeekNumber(date)}`;
      if (timeframe === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return date.getFullYear().toString();
    });
    this.tradesByPeriodBarData.set({
      labels,
      datasets: [
        {
          label: 'Operaciones',
          data: sorted.map(([, count]) => count),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1,
        },
      ],
    });
  }

  aggregateData(curve: any[], timeframe: 'day' | 'week' | 'month' | 'year'): any[] {
    const groups: { [key: string]: any } = {};
    curve.forEach(p => {
      const date = new Date(p.date);
      let key = '';
      if (timeframe === 'day') key = date.toISOString().split('T')[0];
      else if (timeframe === 'week') key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      else if (timeframe === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      else if (timeframe === 'year') key = `${date.getFullYear()}`;
      groups[key] = p;
    });
    return Object.values(groups).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getFilteredCurve(curve: any[], range: Date[]): any[] {
    if (!curve?.length || range.length < 2) return curve;
    const start = new Date(range[0]);
    const end = new Date(range[1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return curve.filter((p: any) => {
      const d = new Date(p.date).getTime();
      return d >= start.getTime() && d <= end.getTime();
    });
  }

  private buildStatsFromCurve(curve: any[]): any {
    if (!curve?.length) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        totalPnL: 0,
        avgWin: 0,
        avgLoss: 0,
        expectancy: 0,
        avgRR: 0,
        maxDrawdown: 0,
        equityCurve: [],
        largestWin: 0,
        largestLoss: 0,
        bestWinStreak: 0,
        bestLossStreak: 0,
        totalWins: 0,
        totalLosses: 0,
      };
    }
    const totalTrades = curve.length;
    const pnls = curve.map((p: any) => Number(p.pnl ?? 0));
    const totalWins = pnls.filter(p => p > 0).length;
    const totalLosses = pnls.filter(p => p <= 0).length;
    const grossProfit = pnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((a, b) => a + b, 0));
    const totalPnL = pnls.reduce((a, b) => a + b, 0);
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    const avgWin = totalWins > 0 ? grossProfit / totalWins : 0;
    const avgLoss = totalLosses > 0 ? grossLoss / totalLosses : 0;
    const probWin = totalWins / totalTrades;
    const probLoss = totalLosses / totalTrades;
    const expectancy = probWin * avgWin - probLoss * avgLoss;
    let peak = 0;
    let maxDrawdown = 0;
    curve.forEach((p: any) => {
      const eq = Number(p.equity);
      if (eq > peak) peak = eq;
      const dd = peak - eq;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });
    const largestWin = pnls.length > 0 ? Math.max(...pnls.filter(p => p > 0), 0) : 0;
    const largestLoss = pnls.length > 0 ? Math.min(...pnls.filter(p => p < 0), 0) : 0;
    let bestWinStreak = 0;
    let bestLossStreak = 0;
    let winStreak = 0;
    let lossStreak = 0;
    pnls.forEach(p => {
      if (p > 0) {
        winStreak++;
        lossStreak = 0;
        if (winStreak > bestWinStreak) bestWinStreak = winStreak;
      } else {
        lossStreak++;
        winStreak = 0;
        if (lossStreak > bestLossStreak) bestLossStreak = lossStreak;
      }
    });
    return {
      totalTrades,
      winRate,
      profitFactor,
      totalPnL,
      avgWin,
      avgLoss,
      expectancy,
      avgRR: 0,
      maxDrawdown,
      equityCurve: curve,
      largestWin,
      largestLoss,
      bestWinStreak,
      bestLossStreak,
      totalWins,
      totalLosses,
    };
  }
}
