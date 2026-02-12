import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-win-rate-widget',
  standalone: true,
  imports: [CommonModule, ChartModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="kpi-layout">
        <div class="kpi-header">
          <div class="flex items-center gap-2">
            <span class="kpi-label">Win Rate</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Porcentaje de operaciones ganadoras sobre el total." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-blue-50">
            <i class="pi pi-percentage"></i>
          </div>
        </div>
        <div class="kpi-value" style="color: #3b82f6;">
          {{ s.winRate | number: '1.0-1' }}%
        </div>
        <div class="kpi-footer"></div>
        <div class="sparkline-container">
          @if (dataService.winRateSparkline(); as sparkline) {
            <p-chart type="line" [data]="sparkline" [options]="dataService.sparklineOptions" height="40px"></p-chart>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .kpi-layout { display: flex; flex-direction: column; height: 100%; position: relative; }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .kpi-label { font-size: 10px; font-weight: 700; color: var(--text-placeholder); text-transform: uppercase; letter-spacing: 0.1em; }
    .kpi-value { font-size: 1.5rem; font-weight: 900; font-family: 'Outfit', monospace; letter-spacing: -0.05em; flex: 1; display: flex; align-items: center; }
    .kpi-footer { font-size: 10px; color: var(--text-placeholder); min-height: 16px; }
  `],
})
export class WinRateWidgetComponent {
  stats = input.required<any>();
  dataService = inject(DashboardDataService);
}
