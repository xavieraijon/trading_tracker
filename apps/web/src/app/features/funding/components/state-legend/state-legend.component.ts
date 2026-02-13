import { Component } from '@angular/core';
import { OperationalState, STATE_LABELS, STATE_COLORS, WEEKEND_COLOR } from '../../models/operational-state';

@Component({
  selector: 'app-state-legend',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-3 p-2 text-xs">
      @for (item of items; track item.label) {
        <div class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm" [style.background-color]="item.color"></span>
          <span>{{ item.label }}</span>
        </div>
      }
    </div>
  `,
})
export class StateLegendComponent {
  items = [
    ...Object.values(OperationalState).map(s => ({
      label: STATE_LABELS[s],
      color: STATE_COLORS[s],
    })),
    { label: 'Weekend', color: WEEKEND_COLOR },
  ];
}
