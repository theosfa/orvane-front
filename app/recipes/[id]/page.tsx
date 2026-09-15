'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { recipesApi, Recipe, ApiError } from '@/lib/api';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recipesApi
      .get(Number(params.id))
      .then(setRecipe)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Рецепт не найден'));
  }, [params.id]);

  if (error) {
    return (
      <main className="page wrap" style={{ maxWidth: 640 }}>
        <p className="error-msg">{error}</p>
        <Link className="btn btn-ghost" style={{ marginTop: 20 }} href="/recipes">
          ← Ко всем рецептам
        </Link>
      </main>
    );
  }

  if (!recipe) return <main className="page wrap state-msg">Загрузка…</main>;

  return (
    <main className="page wrap" style={{ maxWidth: 640 }}>
      <Link href="/recipes" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', textDecoration: 'none' }}>
        ← Ко всем рецептам
      </Link>

      <h1 style={{ marginTop: 18 }}>{recipe.name}</h1>

      <h2 style={{ marginTop: 40, fontSize: '1.2rem' }}>Ингредиенты</h2>
      <ul className="ingredient-list">
        {recipe.ingredients.map((ri) => (
          <li key={ri.ingredientId}>
            <span>{ri.ingredient?.slug ?? `Ингредиент #${ri.ingredientId}`}</span>
            <span>{ri.amount} г</span>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 40, fontSize: '1.2rem' }}>Шаги</h2>
      <ol className="steps-list">
        {recipe.steps
          .sort((a, b) => a.stepNum - b.stepNum)
          .map((s) => (
            <li key={s.stepNum}>
              <span className="step-num">{s.stepNum}</span>
              <span className="step-text">{s.stepText}</span>
            </li>
          ))}
      </ol>
    </main>
  );
}
