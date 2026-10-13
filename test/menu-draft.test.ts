import { describe, expect, it } from 'vitest';
import { dayToSave, emptyForm, isDayDirty, toDraft } from '@/lib/menu';
import type { MenuMeal } from '@/lib/api';

const meal = (entryId: number, mealType: MenuMeal['mealType'], recipeId: number, servings = 2): MenuMeal => ({
  entryId,
  mealType,
  recipeId,
  recipeName: `R${recipeId}`,
  servings,
  calories: 100,
  protein: 1,
  fat: 1,
  carbs: 1,
});

describe('day draft', () => {
  const original = [meal(1, 'dinner', 5), meal(2, 'breakfast', 6, 1)];

  it('is clean right after opening the day', () => {
    expect(isDayDirty(original, toDraft(original), emptyForm())).toBe(false);
  });

  it('is dirty after removing a meal, changing people or picking a recipe', () => {
    const draft = toDraft(original);
    expect(isDayDirty(original, draft.slice(1), emptyForm())).toBe(true);
    expect(isDayDirty(original, [{ ...draft[0], servings: 3 }, draft[1]], emptyForm())).toBe(true);
    expect(isDayDirty(original, draft, { ...emptyForm(), recipeId: 9 })).toBe(true);
  });

  it('saves the draft plus a filled-in form, in meal order', () => {
    const draft = toDraft(original);
    expect(dayToSave(draft, { mealType: 'lunch', recipeId: 9, servings: 4 })).toEqual([
      { mealType: 'breakfast', recipeId: 6, servings: 1 },
      { mealType: 'lunch', recipeId: 9, servings: 4 },
      { mealType: 'dinner', recipeId: 5, servings: 2 },
    ]);
    expect(dayToSave(draft, emptyForm())).toHaveLength(2);
  });
});
