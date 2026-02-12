import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-total-trades-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="flex flex-col h-full justify-between gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-placeholder uppercase tracking-widest">Operaciones</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Número total de operaciones cerradas en el periodo." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-violet-50 text-violet-500">
            <i class="pi pi-chart-bar"></i>
          </div>
        </div>
        <div class="text-2xl font-black font-mono tracking-tighter text-secondary">
          {{ s.totalTrades | number: '1.0-0' }}
        </div>
        <div class="text-[10px] text-placeholder mt-auto pb-1">
          {{ s.totalWins ?? 0 }}W / {{ s.totalLosses ?? 0 }}L
        </div>
      </div>
    }
  `,
})
export class TotalTradesWidgetComponent {
  stats = input.required<any>();
}
