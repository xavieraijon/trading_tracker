import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-max-drawdown-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest text-danger">Max DD</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="La mayor caída desde un pico en la curva de capital. Mide el riesgo máximo." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-rose-50 text-rose-500">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
        </div>
        <div class="text-2xl font-black text-danger font-mono tracking-tighter">
          {{ s.maxDrawdown | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
        <div class="text-[10px] text-placeholder mt-auto pb-1 font-medium">Historical peak-to-trough</div>
      </div>
    }
  `,
})
export class MaxDrawdownWidgetComponent {
  stats = input.required<any>();
}
