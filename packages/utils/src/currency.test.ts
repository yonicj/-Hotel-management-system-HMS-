import { describe, it, expect } from 'vitest';
import { roundMoney, formatCurrency, toMoneyString, Decimal } from './currency';

describe('currency utils', () => {
  it('should round numbers to 2 decimal places using Decimal arithmetic', () => {
    expect(roundMoney(123.456)).toBe(123.46);
    expect(roundMoney(123.454)).toBe(123.45);
    expect(roundMoney(10)).toBe(10);
    expect(roundMoney(new Decimal('100.055'))).toBe(100.06);
    expect(roundMoney('45.999')).toBe(46);
  });

  it('should format money string with exact 2 decimal places', () => {
    expect(toMoneyString(10)).toBe('10.00');
    expect(toMoneyString('123.4')).toBe('123.40');
    expect(toMoneyString(new Decimal('50.555'))).toBe('50.56');
  });

  it('should format currency correctly', () => {
    const formattedUsd = formatCurrency(100, 'USD', 'en-US');
    expect(formattedUsd).toContain('100.00');

    const formattedEtb = formatCurrency(250.5);
    expect(formattedEtb).toContain('250.50');
  });

  it('should prevent floating-point representation errors', () => {
    // 0.1 + 0.2 in raw JS is 0.30000000000000004
    const sum = new Decimal(0.1).plus(0.2);
    expect(sum.toString()).toBe('0.3');
    expect(roundMoney(sum)).toBe(0.3);
  });
});
