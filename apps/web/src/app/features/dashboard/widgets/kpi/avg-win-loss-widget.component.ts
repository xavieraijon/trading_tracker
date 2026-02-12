import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-avg-win-loss-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Avg W/L</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Promedio ganado en trades ganadores vs promedio perdido en perdedores." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-slate-50 text-slate-500">
            <i class="pi pi-arrows-h"></i>
          </div>
        </div>
        <div class="text-md font-black font-mono flex gap-1 items-baseline tracking-tighter">
          <span class="text-success text-lg">{{ s.avgWin | number: '1.0-0' }}</span>
          <span class="text-disabled">/</span>
          <span class="text-danger text-lg">{{ s.avgLoss | number: '1.0-0' }}</span>
        </div>
        <div class="text-[10px] text-placeholder mt-auto pb-1">Risk/Reward profile</div>
      </div>
    }
  `,
})
export class AvgWinLossWidgetComponent {
  stats = input.required<any>();
}
