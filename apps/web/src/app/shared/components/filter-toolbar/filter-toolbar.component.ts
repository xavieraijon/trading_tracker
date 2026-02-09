import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-filter-toolbar',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule, TooltipModule],
  template: `
    <p-toolbar [styleClass]="'bullish-filters-toolbar mb-8 ' + styleClass()">
      <ng-template pTemplate="start">
        <div class="flex flex-wrap gap-4 items-center">
          <ng-content select="[start]"></ng-content>
        </div>
      </ng-template>

      <ng-template pTemplate="end">
        <div class="flex items-center gap-3">
          <ng-content select="[end]"></ng-content>

          @if (showClearButton()) {
            <p-button
              icon="pi pi-filter-slash"
              [text]="true"
              severity="secondary"
              (onClick)="clear.emit()"
              class="hover-shake"
              [raised]="true"
              pTooltip="Limpiar Filtros"
              tooltipPosition="left"
            ></p-button>
          }
        </div>
      </ng-template>
    </p-toolbar>
  `,
  styles: [`
    :host ::ng-deep {
      .bullish-filters-toolbar {
        background: var(--bg-card);
        border-radius: 1.5rem;
        border: 1px solid var(--border-subtle);
        padding: 0.75rem 1.25rem;
        box-shadow: var(--shadow-sm);
        transition: box-shadow 0.2s ease;

        &:hover {
          box-shadow: var(--shadow-md);
        }

        .p-toolbar-content {
          gap: 1rem;
          width: 100%;
        }

        .p-iftalabel {
          label {
            font-weight: 700;
            color: var(--primary-color);
          }
        }
      }
    }

    .hover-shake:hover i {
      animation: shake 0.5s ease-in-out infinite;
    }

    @keyframes shake {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }
  `]
})
export class FilterToolbarComponent {
  styleClass = input<string>('');
  showClearButton = input<boolean>(true);
  clear = output<void>();
}
