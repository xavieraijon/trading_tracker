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
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
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
          borderColor: '#42A5F5',
          tension: 0.4,
          backgroundColor: 'rgba(66, 165, 245, 0.2)'
        }
      ]
    });
  }
}
