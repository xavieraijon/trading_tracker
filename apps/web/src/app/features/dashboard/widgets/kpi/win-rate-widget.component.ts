import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-win-rate-widget',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Win Rate</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Porcentaje de operaciones ganadoras sobre el total." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-blue-50 text-blue-500">
            <i class="pi pi-percentage"></i>
          </div>
        </div>
        <div class="text-2xl font-black text-blue-600 font-mono tracking-tighter">
          {{ s.winRate | number: '1.0-1' }}%
        </div>
        <div class="sparkline-container h-10 mt-2">
          @if (dataService.winRateSparkline(); as sparkline) {
            <p-chart type="line" [data]="sparkline" [options]="dataService.sparklineOptions" height="100%"></p-chart>
          }
        </div>
      </div>
    }
  `,
})
export class WinRateWidgetComponent {
  stats = input.required<any>();
  dataService = inject(DashboardDataService);
}
