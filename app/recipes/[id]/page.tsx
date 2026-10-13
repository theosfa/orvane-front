'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, Recipe, ApiError } from '@/lib/api';
import type { Language } from '@/lib/i18n/languages';
import RequireAuth from '@/components/RequireAuth';
import LikeButton from '@/components/LikeButton';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Pill, ErrorMsg, StateMsg } from '@/components/ui';

function RecipeDetailContent() {
  const params = useParams<{ id: string }>();
  const { t } = useT();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  // set: show the recipe in the author's language instead of the auto-translation
  const [originalLang, setOriginalLang] = useState<Language | undefined>();

  // t changes with the language, so this also reloads the recipe in the new language
  useEffect(() => {
    recipesApi
      .get(Number(params.id), originalLang)
      .then(setRecipe)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('food.notFound')));
  }, [params.id, originalLang, t]);

  if (error) {
    return (
      <main style={{ maxWidth: 960, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ErrorMsg>{error}</ErrorMsg>
        <Link href="/recipes">
          <Btn>{t('food.detailBack')}</Btn>
        </Link>
      </main>
    );
  }

  if (!recipe) return <StateMsg>{t('common.loading')}</StateMsg>;

  return (
    <main style={{ maxWidth: 960, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      <Link href="/recipes" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        {t('food.detailBack')}
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{recipe.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!recipe.isPublic && <Pill>{t('food.private')}</Pill>}
          <LikeButton recipeId={recipe.id} liked={recipe.liked} />
        </div>
      </div>

      {(recipe.autoTranslated || originalLang) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: -16, fontSize: 13, color: 'var(--ink-2)' }}>
          {!originalLang && <span>{t('food.autoTranslated')}</span>}
          <button
            type="button"
            onClick={() => setOriginalLang(originalLang ? undefined : recipe.originalLanguage)}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}
          >
            {originalLang ? t('food.showTranslation') : t('food.showOriginal')}
          </button>
        </div>
      )}

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{t('food.calTitle')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Pill accent>{t('units.kcal', { value: recipe.total.calories })}</Pill>
          <Pill>{t('units.protein', { value: recipe.total.protein })}</Pill>
          <Pill>{t('units.fat', { value: recipe.total.fat })}</Pill>
          <Pill>{t('units.carbs', { value: recipe.total.carbs })}</Pill>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{t('food.ingredientsTitle')}</h2>
        <Card style={{ padding: '4px 20px' }}>
          {recipe.ingredients.map((ri) => (
            <div key={ri.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px dashed var(--stroke-2)' }}>
              <span>{ri.name}</span>
              <span style={{ color: 'var(--ink-2)' }}>
                {t('units.grams', { value: Number(ri.amount) })} · {t('units.kcal', { value: ri.calories })}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{t('food.stepsTitle')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {recipe.steps
            .sort((a, b) => a.stepNum - b.stepNum)
            .map((s) => (
              <div key={s.stepNum} style={{ display: 'flex', gap: 14 }}>
                <span style={{ flex: '0 0 auto', width: 27, height: 27, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--accent-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                  {s.stepNum}
                </span>
                <span style={{ paddingTop: 4, fontSize: 14 }}>{s.stepText}</span>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}

export default function RecipeDetailPage() {
  return (
    <RequireAuth>
      <RecipeDetailContent />
    </RequireAuth>
  );
}
