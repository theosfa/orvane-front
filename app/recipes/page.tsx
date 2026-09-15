'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { recipesApi, Recipe, ApiError } from '@/lib/api';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recipesApi
      .list()
      .then(setRecipes)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить рецепты'));
  }, []);

  return (
    <main className="page wrap">
      <div className="page-header">
        <div>
          <span className="eyebrow">Стол</span>
          <h1>Рецепты</h1>
        </div>
        <Link className="btn btn-primary" href="/recipes/new">
          Добавить рецепт
        </Link>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {!recipes && !error && <p className="state-msg">Загрузка…</p>}

      {recipes && recipes.length === 0 && (
        <div className="empty-state">
          <strong>Рецептов пока нет</strong>
          Добавьте первый — он сразу попадёт в меню на неделю.
        </div>
      )}

      {recipes && recipes.length > 0 && (
        <div className="card-grid">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="recipe-card">
              <span className="recipe-card-icon">🍲</span>
              <h3>{r.name}</h3>
              <div className="recipe-card-meta">
                {r.ingredients.length} {pluralIngredients(r.ingredients.length)} · {r.steps.length} {pluralSteps(r.steps.length)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function pluralIngredients(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ингредиент';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'ингредиента';
  return 'ингредиентов';
}

function pluralSteps(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'шаг';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'шага';
  return 'шагов';
}
