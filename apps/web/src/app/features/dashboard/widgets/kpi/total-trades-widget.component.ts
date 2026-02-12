import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-total-trades-widget',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="kpi-layout">
        <div class="kpi-header">
          <div class="flex items-center gap-2">
            <span class="kpi-label">Operaciones</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Número total de operaciones cerradas en el periodo." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-violet-50">
            <i class="pi pi-chart-bar"></i>
          </div>
        </div>
        <div class="kpi-value text-secondary">
          {{ s.totalTrades | number: '1.0-0' }}
        </div>
        <div class="kpi-footer">{{ s.totalWins ?? 0 }}W / {{ s.totalLosses ?? 0 }}L</div>
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
export class TotalTradesWidgetComponent {
  stats = input.required<any>();
}
