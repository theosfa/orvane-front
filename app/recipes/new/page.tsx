'use client';

import { useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, aiApi, photosApi, CreateRecipeInput, ApiError, GeneratedRecipe } from '@/lib/api';
import { prepareImage } from '@/lib/image';
import PhotoEditor, { PhotoTile } from '@/components/PhotoEditor';
import RequireAuth from '@/components/RequireAuth';
import IngredientPicker from '@/components/IngredientPicker';
import ServingsStepper from '@/components/ServingsStepper';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, GlassInput, GlassTextarea, Field, ErrorMsg, Kicker } from '@/components/ui';

type StepRow = { stepText: string };

const newKey = () => Math.random().toString(36).slice(2);
type IngredientRow = { ingredientId: string; name: string; amount: string };

function NewRecipePageContent() {
  const router = useRouter();
  const { t, lang } = useT();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [servings, setServings] = useState(2);
  // recipe from a photo: a local preview while the AI reads it
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [photoReadError, setPhotoReadError] = useState<string | null>(null);
  const recipePhotoInput = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ ingredientId: '', name: '', amount: '' }]);
  const [steps, setSteps] = useState<StepRow[]>([{ stepText: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [photos, setPhotos] = useState<PhotoTile[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // the tile of the latest AI photo: a new generation replaces it, a stale result is dropped
  const aiPhotoKey = useRef<string | null>(null);
  const photosPending = photos.some((p) => p.status !== 'ready');

  const setTile = (key: string, patch: Partial<PhotoTile> | null) =>
    setPhotos((prev) => (patch ? prev.map((p) => (p.key === key ? { ...p, ...patch } : p)) : prev.filter((p) => p.key !== key)));

  const handleAddPhotos = (files: File[]) => {
    setPhotoError(null);
    for (const file of files) {
      const key = newKey();
      setPhotos((prev) => [...prev, { key, status: 'uploading' }]);
      prepareImage(file)
        .then((blob) => photosApi.upload(blob))
        .then(({ id }) => setTile(key, { id, status: 'ready' }))
        .catch(() => {
          setTile(key, null);
          setPhotoError(t('food.photoError'));
        });
    }
  };

  // a photo of the finished dish for an AI recipe; runs in the background while the user edits
  const generateDishPhoto = (dishName: string, ingredientNames: string[]) => {
    const key = newKey();
    const previous = aiPhotoKey.current;
    aiPhotoKey.current = key;
    setPhotos((prev) => [{ key, status: 'generating' }, ...prev.filter((p) => p.key !== previous)]);
    aiApi
      .generateImage(dishName, ingredientNames)
      .then(({ id }) => {
        if (aiPhotoKey.current === key) setTile(key, { id, status: 'ready' });
      })
      .catch((err) => {
        if (aiPhotoKey.current !== key) return;
        aiPhotoKey.current = null;
        setTile(key, null);
        setPhotoError(err instanceof ApiError && err.status === 429 ? t('food.aiPhotoLimit') : t('food.aiPhotoError'));
      });
  };

  // an AI suggestion (from the chat or a photo) fills the whole form
  const applySuggestion = (suggestion: GeneratedRecipe) => {
    setName(suggestion.name);
    setServings(suggestion.servings);
    const rows = suggestion.ingredients.map((i) => ({
      ingredientId: i.ingredientId ? String(i.ingredientId) : '',
      name: i.name,
      amount: String(i.amount),
    }));
    setIngredients(rows.length ? rows : [{ ingredientId: '', name: '', amount: '' }]);
    setSteps(suggestion.steps.length ? suggestion.steps.map((s) => ({ stepText: s.stepText })) : [{ stepText: '' }]);
  };

  // a photo of a written recipe (transcribed) or of a dish (a recipe made up from it — and the photo
  // itself becomes the main photo); a written recipe gets a generated dish photo, like the chat
  const handleRecipePhoto = async (file: File) => {
    setPhotoReadError(null);
    setPhotoNote(null);
    const preview = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
    setPhotoPreview(preview);
    setReadingPhoto(true);
    try {
      const result = await aiApi.recipeFromPhoto(await prepareImage(file), lang);
      applySuggestion(result);
      if (result.kind === 'dish' && result.photoId) {
        const key = newKey();
        const previous = aiPhotoKey.current;
        aiPhotoKey.current = key; // drops a dish photo still being generated for an earlier recipe
        setPhotos((prev) => [{ key, id: result.photoId!, status: 'ready' }, ...prev.filter((p) => p.key !== previous)]);
        setPhotoNote(t('food.photoImportDish', { name: result.name }));
      } else {
        generateDishPhoto(result.name, result.ingredients.map((i) => i.name));
        setPhotoNote(t('food.photoImportWritten'));
      }
    } catch (err) {
      setPhotoReadError(err instanceof ApiError && err.status === 422 ? t('food.photoImportNothing') : t('food.photoImportError'));
    } finally {
      setReadingPhoto(false);
      setPhotoPreview(null);
      if (preview) URL.revokeObjectURL(preview);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setAiNote(null);
    setGenerating(true);
    try {
      const suggestion = await aiApi.generateRecipe(aiPrompt, lang);
      applySuggestion(suggestion);
      setAiNote(t('food.aiApplied'));
      generateDishPhoto(suggestion.name, suggestion.ingredients.map((i) => i.name));
    } catch {
      setAiError(t('food.aiError'));
    } finally {
      setGenerating(false);
    }
  };

  const updateIngredient = (i: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const removeIngredient = (i: number) => {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const updateStep = (i: number, value: string) => {
    setSteps((prev) => prev.map((row, idx) => (idx === i ? { stepText: value } : row)));
  };

  const removeStep = (i: number) => {
    setSteps((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (ingredients.some((r) => r.amount && !r.ingredientId)) {
      setError(t('food.ingredientUnresolved'));
      return;
    }
    setSubmitting(true);
    try {
      const dto: CreateRecipeInput = {
        name,
        isPublic,
        servings,
        ingredients: ingredients
          .filter((r) => r.ingredientId && r.amount)
          .map((r) => ({
            ingredientId: Number(r.ingredientId),
            amount: Number(r.amount),
          })),
        steps: steps.filter((s) => s.stepText.trim()).map((s, i) => ({ stepNum: i + 1, stepText: s.stepText })),
        photoIds: photos.filter((p) => p.status === 'ready' && p.id).map((p) => p.id!),
      };
      const created = await recipesApi.create(dto);
      router.push(`/recipes/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? t('food.formError') : t('food.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        paddingBottom: 40,
        maxWidth: 960,
        width: '100%',
        margin: '0 auto',
      }}
    >
      <Link href="/recipes" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        {t('food.newBack')}
      </Link>

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Kicker>{t('food.importKicker')}</Kicker>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('food.photoImportHint')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          {readingPhoto && photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview (blob:)
            <img src={photoPreview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--stroke-2)' }} />
          )}
          <Btn variant="primary" onClick={() => recipePhotoInput.current?.click()} disabled={readingPhoto || generating}>
            {readingPhoto ? t('food.photoImportBusy') : t('food.photoImportBtn')}
          </Btn>
          {photoNote && <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{photoNote}</span>}
          <input
            ref={recipePhotoInput}
            type="file"
            accept="image/*"
            hidden
            data-testid="recipe-photo-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleRecipePhoto(file);
            }}
          />
        </div>
        {photoReadError && <ErrorMsg>{photoReadError}</ErrorMsg>}
      </Card>

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Kicker>{t('food.aiKicker')}</Kicker>
        <GlassTextarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={t('food.aiPlaceholder')} rows={2} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn variant="primary" onClick={handleGenerate} disabled={generating || readingPhoto || !aiPrompt.trim()}>
            {generating ? t('food.aiGenerating') : t('food.aiBtn')}
          </Btn>
          {aiNote && <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{aiNote}</span>}
        </div>
        {aiError && <ErrorMsg>{aiError}</ErrorMsg>}
      </Card>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Field label={t('food.nameLabel')}>
          <GlassInput placeholder={t('food.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required style={{ fontSize: 19, fontWeight: 800 }} />
        </Field>

        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Kicker>{t('food.photosLabel')}</Kicker>
          <PhotoEditor
            tiles={photos}
            onAdd={handleAddPhotos}
            onRemove={(key) => setTile(key, null)}
            onMakeMain={(key) => setPhotos((prev) => [...prev.filter((p) => p.key === key), ...prev.filter((p) => p.key !== key)])}
            error={photoError}
          />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('food.servingsLabel')}</span>
          <ServingsStepper value={servings} onChange={setServings} />
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.servingsHint')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('food.visibilityLabel')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip active={isPublic} onClick={() => setIsPublic(true)}>{t('food.public')}</Chip>
            <Chip active={!isPublic} onClick={() => setIsPublic(false)}>{t('food.private')}</Chip>
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{isPublic ? t('food.publicHint') : t('food.privateHint')}</span>
        </div>

        <Card
          as="section"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Kicker>{t('food.ingredientsLabel')}</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ingredients.map((row, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <IngredientPicker
                    name={row.name}
                    invalid={!!row.name && !row.ingredientId}
                    placeholder={t('food.ingredientSearchPlaceholder')}
                    onSelect={(ing) =>
                      setIngredients((prev) =>
                        prev.map((r, idx) =>
                          idx === i
                            ? {
                                ...r,
                                ingredientId: ing ? String(ing.id) : '',
                                name: ing?.name ?? '',
                              }
                            : r,
                        ),
                      )
                    }
                  />
                  <GlassInput
                    placeholder={t('food.gramsPlaceholder')}
                    inputMode="decimal"
                    style={{ width: 110, flexShrink: 0 }}
                    value={row.amount}
                    onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length === 1}
                    aria-label={t('food.removeIngredient')}
                    style={{
                      flexShrink: 0,
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--stroke-2)',
                      background: 'var(--glass-2)',
                      color: 'var(--ink-2)',
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
                {row.name && !row.ingredientId && <span style={{ fontSize: 12, color: '#c0432a', paddingLeft: 4 }}>{t('food.ingredientNotInDb')}</span>}
              </div>
            ))}
          </div>
          <Btn onClick={() => setIngredients((prev) => [...prev, { ingredientId: '', name: '', amount: '' }])} style={{ alignSelf: 'flex-start' }}>
            {t('food.addIngredientBtn')}
          </Btn>
        </Card>

        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Kicker>{t('food.stepsLabel')}</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <GlassTextarea
                  placeholder={t('food.stepPlaceholder', { n: i + 1 })}
                  value={row.stepText}
                  onChange={(e) => updateStep(i, e.target.value)}
                  rows={Math.max(1, Math.ceil(row.stepText.length / 70))}
                  style={{ resize: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1}
                  aria-label={t('food.removeStep')}
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--stroke-2)',
                    background: 'var(--glass-2)',
                    color: 'var(--ink-2)',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Btn onClick={() => setSteps((prev) => [...prev, { stepText: '' }])} style={{ alignSelf: 'flex-start' }}>
            {t('food.addStepBtn')}
          </Btn>
        </Card>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Btn variant="primary" type="submit" disabled={submitting || photosPending} style={{ width: '100%', textAlign: 'center', padding: '14px 22px' }}>
          {submitting ? t('food.saving') : photosPending ? t('food.photosPending') : t('food.save')}
        </Btn>
      </form>
    </main>
  );
}

export default function NewRecipePage() {
  return (
    <RequireAuth>
      <NewRecipePageContent />
    </RequireAuth>
  );
}
