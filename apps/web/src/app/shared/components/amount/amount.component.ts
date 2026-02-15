import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/**
 * Presentational component for monetary amounts.
 * Centralizes font-mono and currency format (symbol before, trading-style).
 * Uses CurrencyPipe in template only so the pipe is resolved from this component's imports.
 */
@Component({
  selector: 'app-amount',
  standalone: true,
  imports: [CurrencyPipe],
  host: {
    class: 'font-mono',
  },
  template: `@if (value() == null) {
    {{ emptyLabel() }}
  } @else {
    @if (showPlus() && value()! > 0) {
      <span>+</span>
    }
    {{ value() | currency: currency() : 'symbol-narrow' : digitsInfo() : locale }}
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmountComponent {
  /** Locale for symbol-before format (e.g. $1,234.56). Not an input to avoid injector issues. */
  protected readonly locale = 'en-US';

  /** Amount to display (null/undefined shows empty or emptyLabel) */
  value = input<number | null | undefined>(null);

  /** Currency code (e.g. 'USD') */
  currency = input.required<string>();

  /** Optional digitsInfo for DecimalPipe-style format (e.g. '1.0-0', '1.2-2') */
  digitsInfo = input<string>();

  /** If true, prepend '+' for positive values (e.g. PnL) */
  showPlus = input<boolean>(false);

  /** When value is null/undefined, show this label instead (e.g. '—') */
  emptyLabel = input<string>();
}
