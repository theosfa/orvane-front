export const MAX_SERVINGS = 50;

// amount is for `from` people — how much is needed for `to`
export function scaleAmount(amount: number | string, from: number, to: number): number {
  const value = Number(amount);
  if (!from || from === to) return value;
  return (value * to) / from;
}

// grams as people read them: whole grams from 10 g up, one decimal below
export function roundGrams(value: number): number {
  return value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
}

export function clampServings(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_SERVINGS, Math.max(1, Math.round(value)));
}
