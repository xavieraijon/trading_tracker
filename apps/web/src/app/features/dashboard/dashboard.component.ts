import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TradesService } from '../trades/trades.service';
import { FilterStore } from '../../core/filter.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TooltipModule, SelectButtonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  stats = signal<any>(null);
  chartData = signal<any>(null);
  selectedTimeframe = signal<'trade' | 'day' | 'week' | 'month'>('trade');

  timeframeOptions = [
    { label: 'Trades', value: 'trade', icon: 'pi pi-list' },
    { label: 'Día', value: 'day', icon: 'pi pi-calendar' },
    { label: 'Semana', value: 'week', icon: 'pi pi-calendar-plus' },
    { label: 'Mes', value: 'month', icon: 'pi pi-calendar-minus' }
  ];

  // Sparkline state
  pnlSparkline = signal<any>(null);
  winRateSparkline = signal<any>(null);
  profitFactorSparkline = signal<any>(null);

  sparklineOptions = {
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
    },
    scales: {
        x: { display: false },
        y: { display: false }
    },
    elements: {
        point: { radius: 0 },
        line: {
            tension: 0.6,
            borderWidth: 1.2,
            capStyle: 'round' as const
        }
    }
  };
  chartOptions = {
    maintainAspectRatio: false,
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
            const stats = this.stats();

            if (timeframe === 'trade') {
                const trade = stats.equityCurve[index];
                return `${trade.side === 'LONG' ? '🟩 LONG' : '🟥 SHORT'} - ${trade.instrument}`;
            }

            return `Balance al final del periodo`;
          },
          label: (item: any) => {
            const timeframe = this.selectedTimeframe();
            const index = item.dataIndex;
            const stats = this.stats();

            let dataPoint;
            if (timeframe === 'trade') {
                dataPoint = stats.equityCurve[index];
            } else {
                dataPoint = this.aggregateData(stats.equityCurve, timeframe)[index];
            }

            const pnlStr = dataPoint.pnl !== undefined ?
                (dataPoint.pnl >= 0 ? `+$${dataPoint.pnl.toFixed(2)}` : `-$${Math.abs(dataPoint.pnl).toFixed(2)}`) :
                'N/A';

            const lines = [
                `Equidad: $${dataPoint.equity.toFixed(2)}`,
                `Fecha: ${new Date(dataPoint.date).toLocaleDateString()}`
            ];

            if (timeframe === 'trade') {
                lines.unshift(`Resultado: ${pnlStr}`);
                lines.push(`Cuenta: ${dataPoint.accountName}`);
            }

            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      },
      y: {
        grid: { borderDash: [5, 5], color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          color: '#64748b',
          font: { family: 'Outfit' },
          callback: (value: any) => '$' + value
        }
      }
    }
  };

  private tradesService = inject(TradesService);
  private filterStore = inject(FilterStore);

  constructor() {
    effect(() => {
        const accountId = this.filterStore.selectedAccountId();
        this.loadStats(accountId);
    });
  }

  loadStats(accountId: string | null) {
    const id = accountId || undefined;
    this.tradesService.getStats(id).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.prepareChartData();
        this.prepareSparklines(data.equityCurve);
      }
    });
  }

  onTimeframeChange() {
    this.prepareChartData();
  }

  prepareSparklines(curve: any[]) {
    if (!curve || curve.length === 0) return;

    // Helper for gradients
    const getGradient = (color: string) => (context: any) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `${color}33`); // 20% opacity
        gradient.addColorStop(1, `${color}00`); // 0% opacity
        return gradient;
    };

    // 1. PnL Sparkline
    this.pnlSparkline.set({
        labels: curve.map((_, i) => i),
        datasets: [{
            data: curve.map(p => p.equity),
            borderColor: '#10b981',
            fill: true,
            backgroundColor: getGradient('#10b981')
        }]
    });

    // 2. Win Rate Sparkline
    let wins = 0;
    const winRateTrend = curve.map((p, i) => {
        if (p.pnl > 0) wins++;
        return (wins / (i + 1)) * 100;
    });

    this.winRateSparkline.set({
        labels: curve.map((_, i) => i),
        datasets: [{
            data: winRateTrend,
            borderColor: '#3b82f6',
            fill: true,
            backgroundColor: getGradient('#3b82f6')
        }]
    });

    // 3. Profit Factor Sparkline
    let grossProfits = 0;
    let grossLosses = 0;
    const pfTrend = curve.map(p => {
        if (p.pnl > 0) grossProfits += p.pnl;
        else grossLosses += Math.abs(p.pnl);
        return grossLosses === 0 ? 0 : grossProfits / grossLosses;
    });

    this.profitFactorSparkline.set({
        labels: curve.map((_, i) => i),
        datasets: [{
            data: pfTrend,
            borderColor: '#f59e0b',
            fill: true,
            backgroundColor: getGradient('#f59e0b')
        }]
    });
  }

  prepareChartData() {
    const stats = this.stats();
    if (!stats || !stats.equityCurve || stats.equityCurve.length === 0) return;

    let dataPoints = stats.equityCurve;
    const timeframe = this.selectedTimeframe();

    if (timeframe !== 'trade') {
        dataPoints = this.aggregateData(stats.equityCurve, timeframe);
    }

    this.chartData.set({
      labels: dataPoints.map((p: any) => {
          const date = new Date(p.date);
          if (timeframe === 'trade') return date.toLocaleDateString();
          if (timeframe === 'day') return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
          if (timeframe === 'week') return `S${this.getWeekNumber(date)}`;
          if (timeframe === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
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
            const {ctx, chartArea} = chart;
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
          pointRadius: timeframe === 'trade' ? 4 : 6,
          pointHoverRadius: 8
        }
      ]
    });
  }

  private aggregateData(curve: any[], timeframe: 'day' | 'week' | 'month'): any[] {
      const groups: { [key: string]: any } = {};

      curve.forEach(p => {
          const date = new Date(p.date);
          let key = '';
          if (timeframe === 'day') key = date.toISOString().split('T')[0];
          else if (timeframe === 'week') {
              const weekNo = this.getWeekNumber(date);
              key = `${date.getFullYear()}-W${weekNo}`;
          }
          else if (timeframe === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;

          // Keep the last equity entry for the period to show progress
          groups[key] = p;
      });

      return Object.values(groups).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  }
}
