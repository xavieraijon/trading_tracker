import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-wins-losses-donut-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="p-4 h-full flex flex-col">
      <div>
        <h2 class="text-lg font-black tracking-tight m-0">Ganadoras vs Perdedoras</h2>
        <p class="text-xs text-placeholder mt-1">Proporción de trades ganadores y perdedores</p>
      </div>
      <div class="flex-1 min-h-0 relative mt-2">
        @if (dataService.winsLossesDonutData(); as data) {
          <p-chart type="doughnut" [data]="data" [options]="dataService.donutChartOptions" height="100%"></p-chart>
        } @else {
          <div class="flex flex-col justify-center items-center h-full bg-surface-muted rounded-2xl border border-dashed border-default">
            <i class="pi pi-pie-chart text-3xl text-disabled mb-2"></i>
            <p class="text-muted text-sm">Sin datos</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class WinsLossesDonutWidgetComponent {
  dataService = inject(DashboardDataService);
}
