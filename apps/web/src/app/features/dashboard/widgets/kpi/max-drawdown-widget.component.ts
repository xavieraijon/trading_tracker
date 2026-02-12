import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-max-drawdown-widget',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="kpi-layout">
        <div class="kpi-header">
          <div class="flex items-center gap-2">
            <span class="kpi-label text-danger">Max DD</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="La mayor caída desde un pico en la curva de capital. Mide el riesgo máximo." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-rose-50">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
        </div>
        <div class="kpi-value text-danger">
          {{ s.maxDrawdown | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
        <div class="kpi-footer">Historical peak-to-trough</div>
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
export class MaxDrawdownWidgetComponent {
  stats = input.required<any>();
}
