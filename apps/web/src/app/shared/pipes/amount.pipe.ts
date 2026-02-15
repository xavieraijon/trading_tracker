import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/**
 * Formats a number as currency with symbol before the value (trading-style).
 * Uses 'symbol-narrow' and locale 'en-US' so USD shows as $1,234.56.
 * Use with app-amount component for centralized font-mono styling.
 */
@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  private readonly currencyPipe = inject(CurrencyPipe);

  private static readonly CURRENCY_LOCALE = 'en-US';

  transform(
    value: number | null | undefined,
    currencyCode: string,
    digitsInfo?: string
  ): string {
    if (value == null) return '';
    return (
      this.currencyPipe.transform(
        value,
        currencyCode,
        'symbol-narrow',
        digitsInfo,
        AmountPipe.CURRENCY_LOCALE
      ) ?? ''
    );
  }
}
