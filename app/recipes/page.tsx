'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { recipesApi, RecipeListItem, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import RecipeGrid from '@/components/RecipeGrid';
import IngredientFilter from '@/components/IngredientFilter';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, GlassInput, StateMsg, ErrorMsg, EmptyState } from '@/components/ui';

function RecipesPageContent() {
  const { t, lang } = useT();
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'liked' | 'following'>('all');
  const [query, setQuery] = useState('');
  const [minCalories, setMinCalories] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    recipesApi.usedIngredients().then(setIngredientOptions).catch(() => setIngredientOptions([]));
  }, [lang]);

  // search + calorie range + ingredients run on the API (search also matches ingredients); debounced while typing
  useEffect(() => {
    const toNumber = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined);
    let cancelled = false;
    const timer = setTimeout(() => {
      recipesApi
        .list({ q: query.trim() || undefined, minCalories: toNumber(minCalories), maxCalories: toNumber(maxCalories), ingredientIds })
        .then((data) => {
          if (!cancelled) {
            setRecipes(data);
            setError(null);
          }
        })
        .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : t('food.error')));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [t, query, minCalories, maxCalories, ingredientIds]);

  const hasFilters = !!query.trim() || !!minCalories.trim() || !!maxCalories.trim() || ingredientIds.length > 0 || filter !== 'all';
  const resetFilters = () => {
    setQuery('');
    setMinCalories('');
    setMaxCalories('');
    setIngredientIds([]);
    setFilter('all');
  };

  const calorieInput = { padding: '8px 12px', fontSize: 13, width: 84, borderRadius: 6 };

  const setLiked = (id: number, liked: boolean) => {
    setRecipes((prev) => prev?.map((r) => (r.id === id ? { ...r, liked } : r)) ?? prev);
  };

  const shown =
    recipes?.filter((r) =>
      filter === 'liked' ? r.liked : filter === 'mine' ? r.isMine : filter === 'following' ? !!r.author?.followed : true,
    ) ?? null;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* raised so the ingredient dropdown isn't covered by the recipe cards below */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <GlassInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('food.searchPlaceholder')}
            aria-label={t('food.searchPlaceholder')}
            style={{ flex: '1 1 260px', width: 'auto' }}
          />
          <Link href="/recipes/new">
            <Btn variant="primary">{t('food.addRecipe')}</Btn>
          </Link>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>{t('food.filterAll')}</Chip>
          <Chip active={filter === 'mine'} onClick={() => setFilter('mine')}>{t('food.mine')}</Chip>
          <Chip active={filter === 'liked'} onClick={() => setFilter('liked')}>{t('nav.food.liked')}</Chip>
          <Chip active={filter === 'following'} onClick={() => setFilter('following')}>{t('food.filterFollowing')}</Chip>
          <span style={{ width: 1, height: 22, background: 'var(--stroke-2)', margin: '0 4px' }} />
          <IngredientFilter options={ingredientOptions} selected={ingredientIds} onChange={setIngredientIds} />
          <span style={{ width: 1, height: 22, background: 'var(--stroke-2)', margin: '0 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
            {t('food.kcal')}
            <GlassInput type="number" min={0} inputMode="numeric" value={minCalories} onChange={(e) => setMinCalories(e.target.value)} placeholder={t('food.from')} aria-label={`${t('food.kcal')} ${t('food.from')}`} style={calorieInput} />
            –
            <GlassInput type="number" min={0} inputMode="numeric" value={maxCalories} onChange={(e) => setMaxCalories(e.target.value)} placeholder={t('food.to')} aria-label={`${t('food.kcal')} ${t('food.to')}`} style={calorieInput} />
          </div>
          {hasFilters && (
            <button type="button" onClick={resetFilters} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
              {t('food.resetFilters')}
            </button>
          )}
        </div>
      </Card>

      {error && <ErrorMsg>{error}</ErrorMsg>}
      {!recipes && !error && <StateMsg>{t('common.loading')}</StateMsg>}

      {shown && shown.length === 0 &&
        (hasFilters ? (
          <EmptyState title={t('food.noResultsTitle')}>{t('food.noResultsBody')}</EmptyState>
        ) : (
          <EmptyState title={t('food.emptyTitle')}>{t('food.emptyBody')}</EmptyState>
        ))}

      {shown && shown.length > 0 && <RecipeGrid recipes={shown} onLikedChange={setLiked} />}
    </main>
  );
}

export default function RecipesPage() {
  return (
    <RequireAuth>
      <RecipesPageContent />
    </RequireAuth>
  );
}
