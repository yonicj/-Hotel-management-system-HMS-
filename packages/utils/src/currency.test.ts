import { describe, it, expect } from 'vitest';
import { roundMoney, formatCurrency } from './currency';

describe('currency utils', () => {
  it('should round numbers to 2 decimal places', () => {
    expect(roundMoney(123.456)).toBe(123.46);
    expect(roundMoney(123.454)).toBe(123.45);
    expect(roundMoney(10)).toBe(10);
  });

  it('should format currency correctly', () => {
    const formatted = formatCurrency(100, 'USD', 'en-US');
    expect(formatted).toContain('100.00');
  });
});

