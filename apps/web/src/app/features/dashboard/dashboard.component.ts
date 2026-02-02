import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { TradesService } from '../trades/trades.service';
import { FilterStore } from '../../core/filter.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TooltipModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  stats = signal<any>(null);
  chartData = signal<any>(null);

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
        line: { tension: 0.4 }
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
            const index = items[0].dataIndex;
            const trade = this.stats().equityCurve[index];
            return `${trade.side === 'LONG' ? '🟩 LONG' : '🟥 SHORT'} - ${trade.instrument}`;
          },
          label: (item: any) => {
            const trade = this.stats().equityCurve[item.dataIndex];
            const pnl = trade.pnl >= 0 ? `+${trade.pnl.toFixed(2)}` : `${trade.pnl.toFixed(2)}`;
            const lines = [
                `Resultado: $${pnl}`,
                `Equidad: $${trade.equity.toFixed(2)}`,
                `Cuenta: ${trade.accountName}`,
                `Fecha: ${new Date(trade.date).toLocaleDateString()}`
            ];
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
        this.prepareChartData(data.equityCurve);
        this.prepareSparklines(data.equityCurve);
      }
    });
  }

  prepareSparklines(curve: any[]) {
    if (!curve || curve.length === 0) return;

    // 1. PnL Sparkline (Equity movement)
    this.pnlSparkline.set({
        labels: curve.map((_, i) => i),
        datasets: [{
            data: curve.map(p => p.equity),
            borderColor: '#10b981',
            borderWidth: 2,
            fill: false
        }]
    });

    // 2. Win Rate Sparkline (Running win rate)
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
            borderWidth: 2,
            fill: false
        }]
    });

    // 3. Profit Factor Sparkline (Simplified trend)
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
            borderWidth: 2,
            fill: false
        }]
    });
  }

  prepareChartData(curve: any[]) {
    if (!curve || curve.length === 0) return;

    this.chartData.set({
      labels: curve.map((_, index) => `${index + 1}`),
      datasets: [
        {
          label: 'Equity',
          data: curve.map(point => point.equity),
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
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#059669',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        }
      ]
    });
  }
}
