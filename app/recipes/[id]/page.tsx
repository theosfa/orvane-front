'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, photosApi, photoUrl, Recipe, RecipePhoto, ApiError } from '@/lib/api';
import { prepareImage } from '@/lib/image';
import PhotoEditor, { PhotoTile } from '@/components/PhotoEditor';
import type { Language } from '@/lib/i18n/languages';
import RequireAuth from '@/components/RequireAuth';
import LikeButton from '@/components/LikeButton';
import AuthorLink from '@/components/AuthorLink';
import ServingsStepper from '@/components/ServingsStepper';
import { roundGrams, scaleAmount } from '@/lib/servings';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Pill, ErrorMsg, StateMsg, Kicker } from '@/components/ui';

// the author manages the photos here; every change is saved right away
function OwnerPhotos({ recipeId, photos, onChange }: { recipeId: number; photos: RecipePhoto[]; onChange: (photos: RecipePhoto[]) => void }) {
  const { t } = useT();
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = (p: Promise<RecipePhoto[]>) =>
    p.then(onChange).catch(() => setError(t('food.photoError')));

  const tiles: PhotoTile[] = [
    ...photos.map((p) => ({ key: p.id, id: p.id, status: 'ready' as const })),
    ...uploading.map((key) => ({ key, status: 'uploading' as const })),
  ];

  return (
    <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kicker>{t('food.photosLabel')}</Kicker>
      <PhotoEditor
        tiles={tiles}
        error={error}
        onRemove={(id) => run(recipesApi.removePhoto(recipeId, id))}
        onMakeMain={(id) => run(recipesApi.makeMainPhoto(recipeId, id))}
        onAdd={(files) => {
          setError(null);
          for (const file of files) {
            const key = Math.random().toString(36).slice(2);
            setUploading((prev) => [...prev, key]);
            prepareImage(file)
              .then((blob) => photosApi.upload(blob))
              .then(({ id }) => recipesApi.addPhotos(recipeId, [id]))
              .then(onChange)
              .catch(() => setError(t('food.photoError')))
              .finally(() => setUploading((prev) => prev.filter((k) => k !== key)));
          }
        }}
      />
    </Card>
  );
}

function RecipeDetailContent() {
  const params = useParams<{ id: string }>();
  const { t } = useT();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  // set: show the recipe in the author's language instead of the auto-translation
  const [originalLang, setOriginalLang] = useState<Language | undefined>();
  // how many people to cook for; null until the recipe loads (then the author's count)
  const [servings, setServings] = useState<number | null>(null);
  // which photo is shown big; the main one by default
  const [shownPhoto, setShownPhoto] = useState<string | null>(null);

  // t changes with the language, so this also reloads the recipe in the new language
  useEffect(() => {
    recipesApi
      .get(Number(params.id), originalLang)
      .then((r) => {
        setRecipe(r);
        setServings((prev) => prev ?? r.servings);
      })
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

  const people = servings ?? recipe.servings;
  const photos = recipe.photos ?? []; // an older API answers without photos
  const bigPhoto = photos.find((p) => p.id === shownPhoto) ?? photos[0];
  const scale = (v: number | string) => scaleAmount(v, recipe.servings, people);
  const round1 = (v: number) => Math.round(v * 10) / 10;

  return (
    <main style={{ maxWidth: 960, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      <Link href="/recipes" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        {t('food.detailBack')}
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{recipe.name}</h1>
          {recipe.author && <AuthorLink author={recipe.author} style={{ fontSize: 14 }} />}
        </div>
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

      {bigPhoto && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- served by our API, already resized */}
          <img
            src={photoUrl(bigPhoto.id)}
            alt={recipe.name}
            data-testid="recipe-photo"
            style={{ width: '100%', aspectRatio: '4 / 3', maxHeight: 460, objectFit: 'cover', borderRadius: 'var(--r-lg)', display: 'block', background: 'var(--glass-2)' }}
          />
          {!recipe.isMine && photos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setShownPhoto(p.id)}
                  style={{ flex: '0 0 64px', height: 64, padding: 0, borderRadius: 'var(--r-sm)', overflow: 'hidden', cursor: 'pointer', border: p.id === bigPhoto.id ? '2px solid var(--accent-deep)' : '1px solid var(--stroke-2)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(p.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {recipe.isMine && (
        <OwnerPhotos
          recipeId={recipe.id}
          photos={photos}
          onChange={(photos) => {
            setShownPhoto(null);
            setRecipe((r) => (r ? { ...r, photos } : r));
          }}
        />
      )}

      <Card as="section" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 15 }}>{t('food.cookFor')}</strong>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.originalServings', { count: recipe.servings })}</span>
        </div>
        <ServingsStepper value={people} onChange={setServings} />
      </Card>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{t('food.calTitle', { count: people })}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Pill accent>{t('units.kcal', { value: Math.round(scale(recipe.total.calories)) })}</Pill>
          <Pill>{t('units.protein', { value: round1(scale(recipe.total.protein)) })}</Pill>
          <Pill>{t('units.fat', { value: round1(scale(recipe.total.fat)) })}</Pill>
          <Pill>{t('units.carbs', { value: round1(scale(recipe.total.carbs)) })}</Pill>
          <Pill>{t('food.perPerson', { value: Math.round(recipe.total.calories / recipe.servings) })}</Pill>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{t('food.ingredientsFor', { count: people })}</h2>
        <Card style={{ padding: '4px 20px' }}>
          {recipe.ingredients.map((ri) => (
            <div key={ri.ingredientId} data-testid="ingredient-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px dashed var(--stroke-2)' }}>
              <span>{ri.name}</span>
              <span style={{ color: 'var(--ink-2)' }}>
                {t('units.grams', { value: roundGrams(scale(ri.amount)) })} · {t('units.kcal', { value: Math.round(scale(ri.calories)) })}
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
