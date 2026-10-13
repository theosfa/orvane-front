import { describe, expect, it } from 'vitest';
import { addDays, monthRange, parseISODate, startOfWeek, toISODate, weekDates, yearRange } from '@/lib/dates';

describe('dates', () => {
  it('round-trips local dates without shifting the day', () => {
    expect(toISODate(parseISODate('2026-03-29'))).toBe('2026-03-29'); // DST switch in Europe
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the Monday of a week', () => {
    expect(startOfWeek('2026-10-13')).toBe('2026-10-12'); // Tuesday
    expect(startOfWeek('2026-10-12')).toBe('2026-10-12'); // Monday
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12'); // Sunday
  });

  it('lists the 7 days of a week', () => {
    expect(weekDates('2026-12-28')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  });

  it('gives month and year ranges', () => {
    expect(monthRange('2026-10-13')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthRange('2026-03-31', -1)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthRange('2026-01-15', -1)).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(yearRange('2026-10-13')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});
