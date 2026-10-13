'use client';

import { useEffect, useState, FormEvent } from 'react';
import { ingredientsApi, Ingredient, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, GlassInput, Field, ErrorMsg, StateMsg, EmptyState, Kicker } from '@/components/ui';

function emptyForm() {
  return { name: '', caloriesPer100g: '', proteinPer100g: '', fatPer100g: '', carbsPer100g: '' };
}

function IngredientsPageContent() {
  const { t, lang } = useT();
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    ingredientsApi
      .list()
      .then(setIngredients)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('food.ingError')));

  useEffect(() => {
    load(); // names come back in the current language, so reload when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const updateField = (field: keyof ReturnType<typeof emptyForm>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await ingredientsApi.create({
        name: form.name,
        caloriesPer100g: Number(form.caloriesPer100g),
        proteinPer100g: Number(form.proteinPer100g),
        fatPer100g: Number(form.fatPer100g),
        carbsPer100g: Number(form.carbsPer100g),
      });
      setForm(emptyForm());
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? t('food.ingFormError') : t('food.ingSaveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Kicker>{t('food.ingAddTitle')}</Kicker>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <Field label={t('food.ingName')}>
            <GlassInput placeholder={t('food.ingNamePh')} value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px,1fr))', gap: 12 }}>
            <Field label={t('food.ingCal')}>
              <GlassInput type="number" min="0" step="0.1" value={form.caloriesPer100g} onChange={(e) => updateField('caloriesPer100g', e.target.value)} required />
            </Field>
            <Field label={t('food.ingProtein')}>
              <GlassInput type="number" min="0" step="0.1" value={form.proteinPer100g} onChange={(e) => updateField('proteinPer100g', e.target.value)} required />
            </Field>
            <Field label={t('food.ingFat')}>
              <GlassInput type="number" min="0" step="0.1" value={form.fatPer100g} onChange={(e) => updateField('fatPer100g', e.target.value)} required />
            </Field>
            <Field label={t('food.ingCarbs')}>
              <GlassInput type="number" min="0" step="0.1" value={form.carbsPer100g} onChange={(e) => updateField('carbsPer100g', e.target.value)} required />
            </Field>
          </div>
          {formError && <ErrorMsg>{formError}</ErrorMsg>}
          <Btn variant="primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
            {submitting ? t('food.ingSaving') : t('food.ingAdd')}
          </Btn>
        </form>
      </Card>

      {error && <ErrorMsg>{error}</ErrorMsg>}
      {!ingredients && !error && <StateMsg>{t('common.loading')}</StateMsg>}

      {ingredients && ingredients.length === 0 && <EmptyState title={t('food.ingEmptyTitle')}>{t('food.ingEmptyBody')}</EmptyState>}

      {ingredients && ingredients.length > 0 && (
        <Card as="section" style={{ padding: '14px 16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) 90px 90px 90px 90px', gap: 12, padding: '12px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
            <span>{t('food.thName')}</span><span>{t('food.thCal')}</span><span>{t('food.thProtein')}</span><span>{t('food.thFat')}</span><span>{t('food.thCarbs')}</span>
          </div>
          {ingredients.map((ing) => (
            <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) 90px 90px 90px 90px', gap: 12, alignItems: 'center', padding: '13px 10px', borderTop: '1px solid var(--stroke-2)' }}>
              <span style={{ fontWeight: 600 }}>{ing.name}</span>
              <span style={{ color: 'var(--ink-2)' }}>{ing.caloriesPer100g}</span>
              <span style={{ color: 'var(--ink-2)' }}>{ing.proteinPer100g}</span>
              <span style={{ color: 'var(--ink-2)' }}>{ing.fatPer100g}</span>
              <span style={{ color: 'var(--ink-2)' }}>{ing.carbsPer100g}</span>
            </div>
          ))}
        </Card>
      )}
    </main>
  );
}

export default function IngredientsPage() {
  return (
    <RequireAuth>
      <IngredientsPageContent />
    </RequireAuth>
  );
}
