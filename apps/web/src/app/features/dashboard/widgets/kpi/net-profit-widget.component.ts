import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-net-profit-widget',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Net Profit</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Beneficio total neto después de todas las operaciones cerradas." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-emerald-50 text-emerald-500">
            <i class="pi pi-dollar"></i>
          </div>
        </div>
        <div class="text-2xl font-black font-mono tracking-tighter" [class.pnl-positive]="s.totalPnL > 0" [class.pnl-negative]="s.totalPnL < 0">
          {{ s.totalPnL | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
        <div class="sparkline-container h-10 mt-2">
          @if (dataService.pnlSparkline(); as sparkline) {
            <p-chart type="line" [data]="sparkline" [options]="dataService.sparklineOptions" height="100%"></p-chart>
          }
        </div>
      </div>
    }
  `,
})
export class NetProfitWidgetComponent {
  stats = input.required<any>();
  dataService = inject(DashboardDataService);
}
