'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  menuApi,
  recipesApi,
  WeekMenu,
  RecipeListItem,
  ShoppingListItem,
  MealType,
  ApiError,
} from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, ErrorMsg, StateMsg, EmptyState, Pill } from '@/components/ui';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function MenuPageContent() {
  const { t, lang, format, weekdays } = useT();
  const DAY_SHORT = weekdays('short');
  const DAY_LABELS = weekdays('long');

  const [week, setWeek] = useState<WeekMenu | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [recipeId, setRecipeId] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(null);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState<string | null>(null);

  const loadWeek = () => menuApi.getWeek().then(setWeek).catch((err) => setError(err instanceof ApiError ? err.message : t('food.menuError')));

  // recipe and ingredient names come back in the current language, so reload when it changes
  useEffect(() => {
    loadWeek();
    recipesApi.list().then(setRecipes).catch(() => setRecipes([]));
    setShoppingList(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipeId) return;
    setFormError(null);
    setAdding(true);
    try {
      await menuApi.addEntry({ dayOfWeek: selectedDay, mealType, recipeId: Number(recipeId) });
      setRecipeId('');
      await loadWeek();
    } catch (err) {
      setFormError(err instanceof ApiError ? t('food.addMealError') : t('auth.errGeneric'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (entryId: number) => {
    setWeek((prev) => (prev ? { ...prev, days: prev.days.map((d) => ({ ...d, meals: d.meals.filter((m) => m.entryId !== entryId) })) } : prev));
    try {
      await menuApi.removeEntry(entryId);
    } finally {
      loadWeek();
    }
  };

  const loadShoppingList = async () => {
    setShoppingError(null);
    setShoppingLoading(true);
    try {
      setShoppingList(await menuApi.shoppingList());
    } catch (err) {
      setShoppingError(err instanceof ApiError ? err.message : t('food.shopError'));
    } finally {
      setShoppingLoading(false);
    }
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!week) return <StateMsg>{t('common.loading')}</StateMsg>;

  const day = week.days[selectedDay];

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Pill accent>{t('food.weekTotal')}: {t('units.kcal', { value: week.weekTotal.calories })}</Pill>
        <Pill>{t('units.protein', { value: week.weekTotal.protein })}</Pill>
        <Pill>{t('units.fat', { value: week.weekTotal.fat })}</Pill>
        <Pill>{t('units.carbs', { value: week.weekTotal.carbs })}</Pill>
      </Card>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {DAY_SHORT.map((label, i) => (
          <Chip key={i} active={i === selectedDay} onClick={() => setSelectedDay(i)}>
            {label}
            {week.days[i].meals.length > 0 && ` · ${format.number(week.days[i].total.calories)}`}
          </Chip>
        ))}
      </div>

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{DAY_LABELS[selectedDay]}</div>

        {day.meals.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13, padding: '12px 0' }}>{t('food.noMeals')}</div>}

        {day.meals.map((m) => (
          <div key={m.entryId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '11px 0', borderBottom: '1px dashed var(--stroke-2)' }}>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>{m.recipeName}</strong>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t(`meals.${m.mealType}`)} · {t('units.macros', { protein: m.protein, fat: m.fat, carbs: m.carbs })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontWeight: 700 }}>{t('units.kcal', { value: m.calories })}</span>
              <button type="button" onClick={() => handleRemove(m.entryId)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        ))}

        {recipes && recipes.length === 0 ? (
          <div style={{ color: 'var(--ink-2)', fontSize: 13, padding: '12px 0' }}>{t('food.addFirstRecipeHint')}</div>
        ) : (
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
            <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--glass-3)', border: '1px solid var(--stroke-2)', color: 'var(--ink)' }}>
              <option value="" disabled>{t('food.chooseRecipe')}</option>
              {recipes?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--glass-3)', border: '1px solid var(--stroke-2)', color: 'var(--ink)' }}>
              {MEAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>{t(`meals.${mt}`)}</option>
              ))}
            </select>
            <Btn variant="primary" type="submit" disabled={adding}>{adding ? t('food.adding') : t('food.add')}</Btn>
          </form>
        )}
        {formError && <ErrorMsg>{formError}</ErrorMsg>}
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{t('food.shoppingTitle')}</h2>
        <Btn onClick={loadShoppingList} disabled={shoppingLoading}>{shoppingLoading ? t('food.gathering') : t('food.gather')}</Btn>
      </div>

      {shoppingError && <ErrorMsg>{shoppingError}</ErrorMsg>}
      {shoppingList && shoppingList.length === 0 && <EmptyState title={t('food.shopEmptyTitle')}>{t('food.shopEmptyBody')}</EmptyState>}
      {shoppingList && shoppingList.length > 0 && (
        <Card style={{ padding: '4px 20px' }}>
          {shoppingList.map((item) => (
            <div key={item.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px dashed var(--stroke-2)' }}>
              <span>{item.name}</span>
              <span style={{ color: 'var(--ink-2)' }}>{t('units.grams', { value: item.amount })}</span>
            </div>
          ))}
        </Card>
      )}
    </main>
  );
}

export default function MenuPage() {
  return (
    <RequireAuth>
      <MenuPageContent />
    </RequireAuth>
  );
}
