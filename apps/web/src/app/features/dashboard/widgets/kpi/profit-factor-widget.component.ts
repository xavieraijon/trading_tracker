import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-profit-factor-widget',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Profit Factor</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Relación entre el beneficio bruto y las pérdidas brutas. > 1.0 es rentable." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-orange-50 text-orange-500">
            <i class="pi pi-bolt"></i>
          </div>
        </div>
        <div class="text-2xl font-black text-orange-600 font-mono tracking-tighter">
          {{ s.profitFactor | number: '1.2-2' }}
        </div>
        <div class="sparkline-container h-10 mt-2">
          @if (dataService.profitFactorSparkline(); as sparkline) {
            <p-chart type="line" [data]="sparkline" [options]="dataService.sparklineOptions" height="100%"></p-chart>
          }
        </div>
      </div>
    }
  `,
})
export class ProfitFactorWidgetComponent {
  stats = input.required<any>();
  dataService = inject(DashboardDataService);
}
