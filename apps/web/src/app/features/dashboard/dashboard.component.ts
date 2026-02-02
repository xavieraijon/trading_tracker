import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TradesService } from '../trades/trades.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = signal<any>(null);
  chartData = signal<any>(null);
  chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { borderDash: [5, 5], color: '#e2e8f0' },
        ticks: {
          color: '#64748b',
          callback: (value: any) => '$' + value
        }
      }
    }
  };

  private tradesService = inject(TradesService);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.tradesService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.prepareChartData(data.equityCurve);
      }
    });
  }

  prepareChartData(curve: any[]) {
    if (!curve || curve.length === 0) return;

    this.chartData.set({
      labels: curve.map((_, index) => `Trade ${index + 1}`),
      datasets: [
        {
          label: 'Equity',
          data: curve.map(point => point.equity),
          fill: true,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4,
          pointBackgroundColor: '#059669',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    });
  }
}
