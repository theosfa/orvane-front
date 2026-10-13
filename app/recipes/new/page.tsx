'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, aiApi, CreateRecipeInput, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import IngredientPicker from '@/components/IngredientPicker';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, GlassInput, GlassTextarea, Field, ErrorMsg, Kicker } from '@/components/ui';

type StepRow = { stepText: string };
type IngredientRow = { ingredientId: string; name: string; amount: string };

function NewRecipePageContent() {
  const router = useRouter();
  const { t, lang } = useT();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ ingredientId: '', name: '', amount: '' }]);
  const [steps, setSteps] = useState<StepRow[]>([{ stepText: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setAiNote(null);
    setGenerating(true);
    try {
      const suggestion = await aiApi.generateRecipe(aiPrompt, lang);
      setName(suggestion.name);
      const rows = suggestion.ingredients.map((i) => ({
        ingredientId: i.ingredientId ? String(i.ingredientId) : '',
        name: i.name,
        amount: String(i.amount),
      }));
      setIngredients(rows.length ? rows : [{ ingredientId: '', name: '', amount: '' }]);
      setSteps(suggestion.steps.length ? suggestion.steps.map((s) => ({ stepText: s.stepText })) : [{ stepText: '' }]);
      setAiNote(t('food.aiApplied'));
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
        ingredients: ingredients
          .filter((r) => r.ingredientId && r.amount)
          .map((r) => ({
            ingredientId: Number(r.ingredientId),
            amount: Number(r.amount),
          })),
        steps: steps.filter((s) => s.stepText.trim()).map((s, i) => ({ stepNum: i + 1, stepText: s.stepText })),
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <GlassInput value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder={t('food.importPlaceholder')} style={{ flex: '1 1 260px' }} />
          <Btn variant="primary">{t('food.importBtn')}</Btn>
          <Btn variant="ghost" style={{ border: '1px dashed var(--stroke-2)' }}>
            {t('food.importPhotoBtn')}
          </Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.importStatusStub')}</div>
      </Card>

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Kicker>{t('food.aiKicker')}</Kicker>
        <GlassTextarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={t('food.aiPlaceholder')} rows={2} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn variant="primary" onClick={handleGenerate} disabled={generating || !aiPrompt.trim()}>
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
                      borderRadius: 12,
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
                    borderRadius: 12,
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
        <Btn variant="primary" type="submit" disabled={submitting} style={{ width: '100%', textAlign: 'center', padding: '14px 22px' }}>
          {submitting ? t('food.saving') : t('food.save')}
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
