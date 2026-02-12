import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-streaks-widget',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (stats(); as s) {
      <div class="kpi-layout">
        <div class="kpi-header">
          <div class="flex items-center gap-2">
            <span class="kpi-label">Rachas</span>
            <i class="pi pi-question-circle text-[10px] cursor-help" pTooltip="Máximo de operaciones ganadoras o perdedoras consecutivas." tooltipPosition="top"></i>
          </div>
          <div class="kpi-icon-container bg-slate-50">
            <i class="pi pi-list"></i>
          </div>
        </div>
        <div class="kpi-value">
          <span class="text-success">{{ s.bestWinStreak ?? 0 }}W</span>
          <span class="text-disabled mx-1">/</span>
          <span class="text-danger">{{ s.bestLossStreak ?? 0 }}L</span>
        </div>
        <div class="kpi-footer">Mejor racha</div>
      </div>
    }
  `,
  styles: [`
    .kpi-layout { display: flex; flex-direction: column; height: 100%; position: relative; }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .kpi-label { font-size: 10px; font-weight: 700; color: var(--text-placeholder); text-transform: uppercase; letter-spacing: 0.1em; }
    .kpi-value { font-size: 1.25rem; font-weight: 900; font-family: 'Outfit', monospace; letter-spacing: -0.05em; flex: 1; display: flex; align-items: center; }
    .kpi-footer { font-size: 10px; color: var(--text-placeholder); min-height: 16px; }
  `],
})
export class StreaksWidgetComponent {
  stats = input.required<any>();
}
