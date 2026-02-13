import { Component, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OperationalState, STATE_COLORS, WEEKEND_COLOR } from '../../models/operational-state';

@Component({
  selector: 'app-day-cell',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div
      class="w-full h-full flex flex-col items-center justify-center text-[10px] leading-tight rounded-sm cursor-default"
      [style.background-color]="bgColor()"
      [style.color]="textColor()"
      [title]="tooltipText()"
    >
      @if (pnl() !== null) {
        <span class="font-semibold">{{ pnl() | currency:'USD':'symbol':'1.0-0' }}</span>
      }
      @if (tradesCount() > 0) {
        <span>{{ tradesCount() }}t</span>
      }
      @if (pnl() === null && !isWeekend()) {
        <span class="opacity-40">—</span>
      }
    </div>
  `,
})
export class DayCellComponent {
  state = input<OperationalState | null>(null);
  pnl = input<number | null>(null);
  tradesCount = input<number>(0);
  isWeekend = input<boolean>(false);

  bgColor = computed(() => {
    if (this.isWeekend()) return WEEKEND_COLOR;
    const s = this.state();
    if (!s) return 'transparent';

    // Override: if pnl < 0, show red regardless of state
    const p = this.pnl();
    if (p !== null && p < 0) return STATE_COLORS[OperationalState.DRAWDOWN];

    return STATE_COLORS[s];
  });

  textColor = computed(() => {
    const bg = this.bgColor();
    // Simple contrast: dark backgrounds get white text
    return ['#166534', '#EF4444', '#F97316', '#9CA3AF'].includes(bg) ? '#fff' : '#1e293b';
  });

  tooltipText = computed(() => {
    const parts: string[] = [];
    const s = this.state();
    if (s) parts.push(s);
    const p = this.pnl();
    if (p !== null) parts.push(`PnL: $${p.toFixed(2)}`);
    if (this.tradesCount() > 0) parts.push(`${this.tradesCount()} trades`);
    if (this.isWeekend()) parts.push('Weekend');
    return parts.join(' | ');
  });
}
