'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, CreateRecipeInput, ApiError } from '@/lib/api';

type StepRow = { stepText: string };
type IngredientRow = { ingredientId: string; amount: string };

export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ ingredientId: '', amount: '' }]);
  const [steps, setSteps] = useState<StepRow[]>([{ stepText: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const dto: CreateRecipeInput = {
        name,
        ingredients: ingredients
          .filter((r) => r.ingredientId && r.amount)
          .map((r) => ({ ingredientId: Number(r.ingredientId), amount: Number(r.amount) })),
        steps: steps
          .filter((s) => s.stepText.trim())
          .map((s, i) => ({ stepNum: i + 1, stepText: s.stepText })),
      };
      const created = await recipesApi.create(dto);
      router.push(`/recipes/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? 'Проверьте поля формы' : 'Не удалось сохранить рецепт');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page wrap" style={{ maxWidth: 600 }}>
      <Link href="/recipes" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', textDecoration: 'none' }}>
        ← Ко всем рецептам
      </Link>

      <h1 style={{ marginTop: 18 }}>Новый рецепт</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32, marginTop: 28 }}>
        <div className="field">
          <label htmlFor="name">Название рецепта</label>
          <input id="name" placeholder="Например, боул с булгуром" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="card">
          <span className="eyebrow">Ингредиенты</span>
          <div className="field-group">
            {ingredients.map((row, i) => (
              <div key={i} className="field-row">
                <input
                  placeholder="ID продукта"
                  value={row.ingredientId}
                  onChange={(e) => updateIngredient(i, 'ingredientId', e.target.value)}
                />
                <input
                  placeholder="Граммы"
                  value={row.amount}
                  onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeIngredient(i)}
                  disabled={ingredients.length === 1}
                  aria-label="Удалить ингредиент"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14 }}
            onClick={() => setIngredients((prev) => [...prev, { ingredientId: '', amount: '' }])}
          >
            + ингредиент
          </button>
        </div>

        <div className="card">
          <span className="eyebrow">Шаги приготовления</span>
          <div className="field-group">
            {steps.map((row, i) => (
              <div key={i} className="field-row">
                <input
                  placeholder={`Шаг ${i + 1}`}
                  value={row.stepText}
                  onChange={(e) => updateStep(i, e.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1}
                  aria-label="Удалить шаг"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14 }}
            onClick={() => setSteps((prev) => [...prev, { stepText: '' }])}
          >
            + шаг
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Сохраняем…' : 'Сохранить рецепт'}
        </button>
      </form>
    </main>
  );
}
