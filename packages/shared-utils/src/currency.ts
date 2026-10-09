/**
 * Format a number as a currency string.
 * @param amount - The numeric amount
 * @param currency - ISO 4217 currency code (default: USD)
 * @param locale - Locale string (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Round a number to 2 decimal places (monetary precision).
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate a percentage of an amount.
 */
export function applyPercentage(amount: number, percent: number): number {
  return roundMoney((amount * percent) / 100);
}
