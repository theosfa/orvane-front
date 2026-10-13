import type { MealType, MenuMeal, MenuMealInput } from './api';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// a meal while its day is being edited; nothing reaches the API until the day is saved
export type DraftMeal = { key: string; mealType: MealType; recipeId: number; recipeName: string; servings: number };

// the "add a meal" fields; recipeId '' = nothing chosen yet
export type MealForm = { mealType: MealType; recipeId: number | ''; servings: number };

export const emptyForm = (): MealForm => ({ mealType: 'dinner', recipeId: '', servings: 2 });

export function toDraft(meals: MenuMeal[]): DraftMeal[] {
  return meals.map((m) => ({ key: `e${m.entryId}`, mealType: m.mealType, recipeId: m.recipeId, recipeName: m.recipeName, servings: m.servings }));
}

const signature = (meals: { mealType: MealType; recipeId: number; servings: number }[]) =>
  meals.map((m) => `${m.mealType}:${m.recipeId}:${m.servings}`).join('|');

// leaving now would lose something: meals added/removed, or a recipe picked but not added yet
export function isDayDirty(original: MenuMeal[], draft: DraftMeal[], form: MealForm): boolean {
  return form.recipeId !== '' || signature(original) !== signature(draft);
}

// what to save: the draft plus the half-filled form if a recipe is chosen, breakfast→snack order
export function dayToSave(draft: DraftMeal[], form: MealForm): MenuMealInput[] {
  const meals = draft.map(({ mealType, recipeId, servings }) => ({ mealType, recipeId, servings }));
  if (form.recipeId !== '') meals.push({ mealType: form.mealType, recipeId: form.recipeId, servings: form.servings });
  return meals
    .map((m, i) => ({ m, i }))
    .sort((a, b) => MEAL_TYPES.indexOf(a.m.mealType) - MEAL_TYPES.indexOf(b.m.mealType) || a.i - b.i)
    .map(({ m }) => m);
}
