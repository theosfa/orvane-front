import { describe, expect, it } from 'vitest';
import { scaleStepText } from '@/lib/scale-steps';

const join = (text: string, factor: number, locale = 'uk') => scaleStepText(text, factor, locale).map((p) => p.text).join('');

describe('scaleStepText', () => {
  it('halves the amounts in a step and leaves times alone', () => {
    const step = 'Промийте 240 г гречки під холодною водою. У каструлі доведіть до кипіння 650 г води, додайте 2 г солі та варіть 15-18 хвилин.';
    expect(join(step, 0.5)).toBe(
      'Промийте 120 г гречки під холодною водою. У каструлі доведіть до кипіння 325 г води, додайте 1 г солі та варіть 15-18 хвилин.',
    );
  });

  it('marks exactly the recalculated amounts', () => {
    const parts = scaleStepText('Додайте 250 г шампіньйонів і 20 г соусу.', 2, 'uk');
    expect(parts.filter((p) => p.scaled).map((p) => p.text)).toEqual(['500 г', '40 г']);
  });

  it('handles decimals, ranges, kilos, litres and pieces', () => {
    expect(join('1,5 кг картоплі', 2)).toBe('3 кг картоплі');
    expect(join('0,5 л бульйону', 0.5)).toBe('0,25 л бульйону');
    expect(join('150–200 мл вершків', 2)).toBe('300–400 мл вершків');
    expect(join('3 шт. яєць', 2)).toBe('6 шт. яєць');
    expect(join('1 г перцю', 0.5)).toBe('0,5 г перцю');
  });

  it('does not touch numbers that are not amounts', () => {
    const step = 'Запікайте 2 години при 180 °C, потім 5 хвилин на гриль, крок 3.';
    expect(join(step, 3)).toBe(step);
    expect(join('Bake 2 large potatoes for 40 min', 2)).toBe('Bake 2 large potatoes for 40 min');
  });

  it('works for English and formats numbers for the locale', () => {
    expect(join('Add 150 g rice and 1.5 kg chicken, then 1,500 g water', 0.5, 'en')).toBe(
      'Add 75 g rice and 0.75 kg chicken, then 750 g water',
    );
    expect(join('Dodaj 200 g mąki', 1.5, 'pl')).toBe('Dodaj 300 g mąki');
  });

  it('returns the text unchanged for the original number of people', () => {
    expect(scaleStepText('240 г гречки', 1, 'uk')).toEqual([{ text: '240 г гречки', scaled: false }]);
  });
});
