import Decimal from 'decimal.js';

export { Decimal };

export type DecimalValue = Decimal.Value;

/**
 * Configure Decimal default rounding mode to HALF_UP (standard banking/accounting).
 */
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert any numeric, string, or Decimal value into a Decimal instance.
 */
export function toDecimal(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

/**
 * Round a monetary value to 2 decimal places using Decimal arithmetic.
 */
export function roundMoney(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Return exact 2-decimal string representation (e.g. "123.45").
 */
export function toMoneyString(value: Decimal.Value): string {
  return new Decimal(value).toFixed(2);
}

/**
 * Format a number or Decimal as a currency string (defaulting to ETB).
 */
export function formatCurrency(
  amount: Decimal.Value,
  currency: string = 'ETB',
  locale: string = 'en-US'
): string {
  const num = roundMoney(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}
