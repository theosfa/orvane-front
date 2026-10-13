// Calendar dates as 'YYYY-MM-DD' strings in the user's local time zone — the format the API
// uses for days. Never go through toISOString(): it converts to UTC and can shift the day.

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// local midnight of that day
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// Monday of the week the day falls in
export function startOfWeek(iso: string): string {
  const day = parseISODate(iso).getDay(); // 0 = Sunday
  return addDays(iso, -((day + 6) % 7));
}

// the 7 days Monday..Sunday starting at a Monday
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// first and last day of the month, offset months from the given day (-1 = previous month)
export function monthRange(iso: string, offset = 0): { from: string; to: string } {
  const d = parseISODate(iso);
  const first = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
  return { from: toISODate(first), to: toISODate(last) };
}

export function yearRange(iso: string): { from: string; to: string } {
  const y = parseISODate(iso).getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export function today(): string {
  return toISODate(new Date());
}
