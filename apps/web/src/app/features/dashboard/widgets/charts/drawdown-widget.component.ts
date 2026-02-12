import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-drawdown-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="p-4 h-full flex flex-col">
      <div>
        <h2 class="text-xl font-black tracking-tight m-0">Drawdown en el tiempo</h2>
        <p class="text-xs text-placeholder mt-1">Caída desde el pico máximo de la curva de capital</p>
      </div>
      <div class="flex-1 min-h-0 relative mt-4">
        @if (dataService.drawdownChartData(); as data) {
          <p-chart type="line" [data]="data" [options]="dataService.drawdownChartOptions" height="100%"></p-chart>
        } @else {
          <div class="flex flex-col justify-center items-center h-full bg-surface-muted rounded-2xl border border-dashed border-default">
            <i class="pi pi-chart-line text-4xl text-disabled mb-3"></i>
            <p class="text-muted font-medium">No hay datos para el drawdown.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class DrawdownWidgetComponent {
  dataService = inject(DashboardDataService);
}
