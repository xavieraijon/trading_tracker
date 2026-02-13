import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-equity-curve-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="p-4 h-full flex flex-col">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 class="text-xl font-black tracking-tight m-0">Curva de capital</h2>
          <p class="text-xs text-placeholder mt-1">Rendimiento acumulado de la cuenta (dato más relevante)</p>
        </div>
      </div>
      <div class="flex-1 min-h-0 relative">
        @if (dataService.chartData(); as data) {
          <p-chart type="line" [data]="data" [options]="dataService.chartOptions" height="100%"></p-chart>
        } @else {
          <div class="flex flex-col justify-center items-center h-full bg-surface-muted rounded-2xl border border-dashed border-default">
            <i class="pi pi-chart-line text-4xl text-disabled mb-3"></i>
            <p class="text-muted font-medium">No hay datos suficientes para mostrar la curva.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class EquityCurveWidgetComponent {
  dataService = inject(DashboardDataService);
}
