import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-largest-loss-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Mayor pérdida</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="La operación perdedora con mayor pérdida." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-rose-50 text-rose-500">
            <i class="pi pi-arrow-down"></i>
          </div>
        </div>
        <div class="text-2xl font-black font-mono tracking-tighter text-danger">
          {{ (s.largestLoss ?? 0) | currency: 'USD' : 'symbol' : '1.0-0' }}
        </div>
      </div>
    }
  `,
})
export class LargestLossWidgetComponent {
  stats = input.required<any>();
}
