import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-expectancy-widget',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="kpi-layout">
        <div class="kpi-header">
          <div class="flex items-center gap-2">
            <span class="kpi-label">Expectancy</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Beneficio esperado por operación (promedio ponderado por probabilidad)." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-cyan-50">
            <i class="pi pi-calculator"></i>
          </div>
        </div>
        <div class="kpi-value" [class.pnl-positive]="(s.expectancy ?? 0) >= 0" [class.pnl-negative]="(s.expectancy ?? 0) < 0">
          {{ s.expectancy | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
        <div class="kpi-footer">Por trade</div>
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
export class ExpectancyWidgetComponent {
  stats = input.required<any>();
}
