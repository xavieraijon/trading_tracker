import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-activity-by-period-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="p-4 h-full flex flex-col">
      <div>
        <h2 class="text-xl font-black tracking-tight m-0">Actividad por periodo</h2>
        <p class="text-xs text-placeholder mt-1">Número de operaciones cerradas por {{ periodLabel }}</p>
      </div>
      <div class="flex-1 min-h-0 relative mt-4">
        @if (dataService.selectedTimeframe() !== 'all' && dataService.tradesByPeriodBarData(); as data) {
          <p-chart type="bar" [data]="data" [options]="dataService.tradesByPeriodBarOptions" height="100%"></p-chart>
        } @else {
          <div class="flex flex-col justify-center items-center h-full bg-surface-muted rounded-2xl border border-dashed border-default">
            <i class="pi pi-chart-bar text-4xl text-disabled mb-3"></i>
            <p class="text-muted font-medium">Selecciona un periodo distinto a "Todos" para ver este gráfico.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ActivityByPeriodWidgetComponent {
  dataService = inject(DashboardDataService);

  get periodLabel(): string {
    const tf = this.dataService.selectedTimeframe();
    if (tf === 'day') return 'día';
    if (tf === 'week') return 'semana';
    if (tf === 'month') return 'mes';
    if (tf === 'year') return 'año';
    return 'periodo';
  }
}
