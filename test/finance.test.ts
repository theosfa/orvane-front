import { describe, expect, it } from 'vitest';
import { parseAmount, periodRange } from '@/lib/finance';

describe('periodRange', () => {
  const today = '2026-10-13';
  it('maps presets to date bounds', () => {
    expect(periodRange('thisMonth', today)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodRange('lastMonth', today)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodRange('thisYear', today)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(periodRange('all', today)).toEqual({});
  });
  it('uses the custom bounds as typed, dropping empty ones', () => {
    expect(periodRange('custom', today, { from: '2026-05-01', to: '' })).toEqual({ from: '2026-05-01', to: undefined });
  });
});

describe('parseAmount', () => {
  it('accepts dots, commas, spaces and a euro sign', () => {
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount(' 12,50 ')).toBe(12.5);
    expect(parseAmount('€ 3')).toBe(3);
  });
  it('rejects junk, zero, too many decimals and negatives by default', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
  it('allows zero and negatives for balances', () => {
    expect(parseAmount('-5,25', { allowNegative: true })).toBe(-5.25);
    expect(parseAmount('0', { allowNegative: true })).toBe(0);
  });
});
