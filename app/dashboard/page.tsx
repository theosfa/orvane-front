'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, Recipe } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) recipesApi.list().then(setRecipes).catch(() => setRecipes([]));
  }, [user]);

  if (loading || !user) {
    return <main className="page wrap state-msg">Загрузка…</main>;
  }

  const recent = recipes?.slice(0, 3) ?? [];

  return (
    <main className="page wrap">
      <div className="page-header">
        <div>
          <span className="eyebrow">С возвращением</span>
          <h1>{user.email}</h1>
          <p className="page-sub">Вот что сейчас работает в вашем Ладе.</p>
        </div>
        <Link className="btn btn-primary" href="/recipes/new">
          Добавить рецепт
        </Link>
      </div>

      <div className="module-status-row">
        <div className="status-card">
          <div className="status-card-top">
            <span className="module-tag" style={{ background: 'var(--food-tint)', color: 'var(--food)' }}>
              Стол
            </span>
            <span className="status-pill live">активен</span>
          </div>
          <p>
            {recipes === null
              ? 'Загружаем рецепты…'
              : recipes.length > 0
                ? `${recipes.length} ${pluralRecipes(recipes.length)} в вашей книге.`
                : 'Пока нет ни одного рецепта.'}
          </p>
          <Link href="/recipes">Смотреть рецепты →</Link>
        </div>

        <div className="status-card">
          <div className="status-card-top">
            <span className="module-tag" style={{ background: 'var(--finance-tint)', color: 'var(--finance)' }}>
              Счёт
            </span>
            <span className="status-pill">скоро</span>
          </div>
          <p>Бюджет и конверты трат появятся здесь одними из следующих.</p>
        </div>

        <div className="status-card">
          <div className="status-card-top">
            <span className="module-tag" style={{ background: 'var(--future-tint)', color: 'var(--future)' }}>
              Путь
            </span>
            <span className="status-pill">скоро</span>
          </div>
          <p>Долгосрочные цели и задачи подключим следом за Счётом.</p>
        </div>
      </div>

      <div style={{ marginTop: 48 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.4rem' }}>Недавние рецепты</h2>
          <Link className="btn btn-ghost btn-sm" href="/ingredients">
            Продукты
          </Link>
        </div>

        {recipes === null && <p className="state-msg" style={{ padding: '24px 0' }}>Загрузка…</p>}

        {recipes && recipes.length === 0 && (
          <div className="empty-state">
            <strong>Рецептов пока нет</strong>
            Добавьте первый — он сразу попадёт в меню на неделю.
          </div>
        )}

        {recent.length > 0 && (
          <div className="card" style={{ padding: '8px 28px' }}>
            {recent.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} className="recipe-preview-row">
                <strong>{r.name}</strong>
                <span className="recipe-preview-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function pluralRecipes(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'рецепт';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'рецепта';
  return 'рецептов';
}
