'use client';

import { useEffect, useState } from 'react';
import { ingredientsApi, Ingredient, ApiError } from '@/lib/api';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ingredientsApi
      .list('ru')
      .then(setIngredients)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить продукты'));
  }, []);

  return (
    <main className="page wrap">
      <div className="page-header">
        <div>
          <span className="eyebrow">Стол</span>
          <h1>Продукты</h1>
          <p className="page-sub">Калории и БЖУ на 100 г — то, на чём считаются все ваши рецепты.</p>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {!ingredients && !error && <p className="state-msg">Загрузка…</p>}

      {ingredients && ingredients.length === 0 && (
        <div className="empty-state">
          <strong>Продуктов пока нет</strong>
          Они появятся здесь, как только их добавят в базу.
        </div>
      )}

      {ingredients && ingredients.length > 0 && (
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Ккал</th>
                  <th>Белки</th>
                  <th>Жиры</th>
                  <th>Углеводы</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td>{ing.translations?.[0]?.name ?? ing.slug}</td>
                    <td>{ing.caloriesPer100g}</td>
                    <td>{ing.proteinPer100g}</td>
                    <td>{ing.fatPer100g}</td>
                    <td>{ing.carbsPer100g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
