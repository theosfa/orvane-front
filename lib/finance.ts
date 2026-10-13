import { monthRange, yearRange } from './dates';

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'all' | 'custom';

export const PERIOD_PRESETS: PeriodPreset[] = ['thisMonth', 'lastMonth', 'thisYear', 'all', 'custom'];

// from/to for a period relative to today; 'all' has no bounds, 'custom' keeps what the user typed
export function periodRange(
  preset: PeriodPreset,
  todayIso: string,
  custom: { from?: string; to?: string } = {},
): { from?: string; to?: string } {
  switch (preset) {
    case 'thisMonth':
      return monthRange(todayIso);
    case 'lastMonth':
      return monthRange(todayIso, -1);
    case 'thisYear':
      return yearRange(todayIso);
    case 'all':
      return {};
    case 'custom':
      return { from: custom.from || undefined, to: custom.to || undefined };
  }
}

// "12,5" / " 12.50 " / "€ 3" -> number; null when it isn't a usable amount
export function parseAmount(input: string, { allowNegative = false } = {}): number | null {
  const cleaned = input.replace(/[\s€]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!allowNegative && value <= 0) return null;
  return value;
}
