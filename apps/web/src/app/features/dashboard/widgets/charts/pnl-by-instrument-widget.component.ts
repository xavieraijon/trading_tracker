import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-pnl-by-instrument-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="p-4 h-full flex flex-col">
      <div>
        <h2 class="text-xl font-black tracking-tight m-0">P&amp;L por instrumento</h2>
        <p class="text-xs text-placeholder mt-1">Top 8 activos por contribución al resultado (positiva o negativa)</p>
      </div>
      <div class="flex-1 min-h-0 relative mt-4">
        @if (dataService.pnlByInstrumentBarData(); as data) {
          <p-chart type="bar" [data]="data" [options]="dataService.horizontalBarOptions" height="100%"></p-chart>
        } @else {
          <div class="flex flex-col justify-center items-center h-full bg-surface-muted rounded-2xl border border-dashed border-default">
            <i class="pi pi-chart-bar text-3xl text-disabled mb-2"></i>
            <p class="text-muted text-sm">Sin datos</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class PnlByInstrumentWidgetComponent {
  dataService = inject(DashboardDataService);
}
