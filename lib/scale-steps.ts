// Recalculates the amounts written inside a step ("Add 240 g buckwheat", "1,5 кг", "150–200 мл")
// for another number of people. Only numbers followed by a weight / volume / piece unit change;
// times, temperatures and other numbers ("15-18 хвилин", "180 °C", "2 години") stay as written.
import { roundGrams } from './servings';

export type StepPart = { text: string; scaled: boolean };

// longer units first, so "кг" is not read as "г"; a unit must not run into a letter ("2 години").
// No lookbehind (older iPhones can't parse it): the char before the number is captured instead.
const AMOUNT = new RegExp(
  '(^|[^\\p{L}\\p{N}.,])(\\d+(?:[.,]\\d+)?)(?:(\\s?[-–—]\\s?)(\\d+(?:[.,]\\d+)?))?(\\s?)' +
    '(кг|мг|гр|г|мл|л|шт\\.?|kg|mg|gr|g|ml|l|pcs|szt\\.?)(?!\\p{L})',
  'giu',
);

const BIG_UNITS = new Set(['кг', 'л', 'kg', 'l']);

// "1,5" and "1.5" are decimals; "1,500" (comma + three digits) is a thousands separator
function parse(raw: string): number {
  return Number(/^\d{1,3},\d{3}$/.test(raw) ? raw.replace(',', '') : raw.replace(',', '.'));
}

function round(value: number, unit: string): number {
  if (!BIG_UNITS.has(unit.toLowerCase())) return roundGrams(value);
  // kilos and litres: 0.25 kg, 1.5 l, 12 kg
  if (value < 1) return Math.round(value * 100) / 100;
  if (value < 10) return Math.round(value * 10) / 10;
  return Math.round(value);
}

export function scaleStepText(text: string, factor: number, locale: string): StepPart[] {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return [{ text, scaled: false }];
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false });
  const parts: StepPart[] = [];
  let last = 0;
  AMOUNT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = AMOUNT.exec(text)) !== null) {
    const [whole, before, from, dash, to, space, unit] = m;
    const at = (m.index ?? 0) + before.length;
    if (at > last) parts.push({ text: text.slice(last, at), scaled: false });
    const scaled =
      fmt.format(round(parse(from) * factor, unit)) +
      (to !== undefined ? dash + fmt.format(round(parse(to) * factor, unit)) : '') +
      space +
      unit;
    parts.push({ text: scaled, scaled: true });
    last = (m.index ?? 0) + whole.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), scaled: false });
  return parts;
}
