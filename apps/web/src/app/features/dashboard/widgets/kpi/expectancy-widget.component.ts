import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-expectancy-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Expectancy</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Beneficio esperado por operación (promedio ponderado por probabilidad)." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-cyan-50 text-cyan-500">
            <i class="pi pi-calculator"></i>
          </div>
        </div>
        <div class="text-2xl font-black font-mono tracking-tighter" [class.pnl-positive]="(s.expectancy ?? 0) >= 0" [class.pnl-negative]="(s.expectancy ?? 0) < 0">
          {{ s.expectancy | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
        <div class="text-[10px] text-placeholder mt-auto pb-1">Por trade</div>
      </div>
    }
  `,
})
export class ExpectancyWidgetComponent {
  stats = input.required<any>();
}
