import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-streaks-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Rachas</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Máximo de operaciones ganadoras o perdedoras consecutivas." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-slate-50 text-slate-500">
            <i class="pi pi-list"></i>
          </div>
        </div>
        <div class="text-lg font-black font-mono tracking-tighter flex items-baseline gap-2">
          <span class="text-success">{{ s.bestWinStreak ?? 0 }}W</span>
          <span class="text-disabled">/</span>
          <span class="text-danger">{{ s.bestLossStreak ?? 0 }}L</span>
        </div>
        <div class="text-[10px] text-placeholder mt-auto pb-1">Mejor racha</div>
      </div>
    }
  `,
})
export class StreaksWidgetComponent {
  stats = input.required<any>();
}
