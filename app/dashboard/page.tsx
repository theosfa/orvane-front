'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, menuApi, financeApi, RecipeListItem, WeekMenu, FinanceSummary } from '@/lib/api';
import { monthRange, today } from '@/lib/dates';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { useFutureMock } from '@/lib/mock/future-context';
import { Card, Btn, Grid, EmptyState, StateMsg } from '@/components/ui';

function DashboardPageContent() {
  const { user } = useAuth();
  const { t, lang, money, weekdays } = useT();
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [week, setWeek] = useState<WeekMenu | null>(null);
  const { tasks } = useFutureMock();
  const [month, setMonth] = useState<FinanceSummary | null>(null);

  // recipe names come back in the current language, so reload when it changes
  useEffect(() => {
    recipesApi.list().then(setRecipes).catch(() => setRecipes([]));
    menuApi.getWeek().then(setWeek).catch(() => setWeek(null));
    financeApi.summary(monthRange(today())).then(setMonth).catch(() => setMonth(null));
  }, [lang]);

  if (!user) return null;

  const recent = recipes?.slice(0, 4) ?? [];
  const openTasks = tasks.filter((tk) => !tk.done).length;
  const plannedDays = week?.days.filter((d) => d.meals.length > 0).length ?? 0;
  const spentTotal = month?.expense ?? 0;
  // share of this month's income already spent
  const spentPct = month?.income ? Math.min(100, Math.round((spentTotal / month.income) * 100)) : 0;
  const DAY_SHORT = weekdays('short');
  const biggest = month?.byCategory.find((c) => c.type === 'expense');

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card style={{ padding: '38px 36px', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)', color: 'var(--accent-ink)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -90, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.85 }}>{t('dashboard.greeting')}</div>
          <div style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em', maxWidth: '30ch' }}>{user.email}</div>
          <div style={{ fontSize: 14, opacity: 0.9, maxWidth: '48ch' }}>{t('dashboard.subtitle')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            <Link href="/recipes/new" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', padding: '11px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: 'var(--accent-ink)', border: '1px solid rgba(255,255,255,0.35)' }}>
              {t('dashboard.addRecipe')}
            </Link>
            <Link href="/menu" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', padding: '11px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: 'var(--accent-ink)', border: '1px solid rgba(255,255,255,0.35)' }}>
              {t('nav.food.menu')}
            </Link>
          </div>
        </div>
      </Card>

      <Grid min={220}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('dashboard.spendCard')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>{money(spentTotal, 0)}</div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--glass-2)', overflow: 'hidden' }}>
            <div style={{ width: `${spentPct}%`, height: '100%', borderRadius: 999, background: 'var(--accent)' }} />
          </div>
          <Link href="/finance/spending" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>{t('nav.finance.name')} →</Link>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('dashboard.mealsCard')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>{plannedDays}<span style={{ fontSize: 17, color: 'var(--ink-2)' }}> / 7</span></div>
          <div style={{ display: 'flex', gap: 4 }}>
            {DAY_SHORT.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 8, borderRadius: 999, background: (week?.days[i]?.meals.length ?? 0) > 0 ? 'var(--accent)' : 'var(--glass-2)' }} />
            ))}
          </div>
          <Link href="/future/plan" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>{t('dashboard.openTasks', { count: openTasks })} →</Link>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('dashboard.proteinCard')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>{recipes?.length ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{recipes === null ? t('dashboard.foodLoading') : t('food.recipesTitle')}</div>
          <Link href="/recipes" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>{t('dashboard.viewRecipes')}</Link>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.topCategory')}</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{biggest ? (biggest.name ?? t('finance.noCategory')) : '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{money(biggest?.total ?? 0, 0)}</div>
          <Link href="/finance/spending" style={{ marginTop: 'auto' }}>
            <Btn variant="primary">{t('nav.finance.spending')}</Btn>
          </Link>
        </Card>
      </Grid>

      <Grid min={320}>
        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{t('dashboard.weekPlanTitle')}</h2>
          {!week && <StateMsg>{t('common.loading')}</StateMsg>}
          {week?.days.map((d, i) => {
            const first = d.meals[0];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 10px' }}>
                <div style={{ width: 42, flex: '0 0 42px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{DAY_SHORT[i]}</div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{first?.recipeName ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{d.meals.length > 1 ? t('dashboard.moreMeals', { count: d.meals.length - 1 }) : ''}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{d.total.calories ? t('units.kcal', { value: d.total.calories }) : '—'}</div>
              </div>
            );
          })}
          <Link href="/menu" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            <Btn>{t('nav.food.menu')}</Btn>
          </Link>
        </Card>

        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{t('dashboard.recentTitle')}</h2>
          {recipes === null && <StateMsg>{t('common.loading')}</StateMsg>}
          {recipes && recipes.length === 0 && <EmptyState title={t('dashboard.emptyTitle')}>{t('dashboard.emptyBody')}</EmptyState>}
          {recent.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '13px 10px', borderBottom: '1px solid var(--stroke-2)', color: 'inherit' }}>
              <strong>{r.name}</strong>
              <span style={{ color: 'var(--ink-2)' }}>→</span>
            </Link>
          ))}
          <Link href="/ingredients" style={{ alignSelf: 'flex-start', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>
            {t('dashboard.ingredientsLink')} →
          </Link>
        </Card>
      </Grid>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardPageContent />
    </RequireAuth>
  );
}
