'use client';

import { CSSProperties, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, menuApi, financeApi, tasksApi, RecipeListItem, WeekMenu, FinanceSummary, Task } from '@/lib/api';
import { addDays, monthRange, startOfWeek, today } from '@/lib/dates';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { Card, EmptyState, StateMsg } from '@/components/ui';
import { Icon } from '@/components/icons';

const label: CSSProperties = { fontSize: 14, fontWeight: 700 };
const bigNumber: CSSProperties = { fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 };
const unit: CSSProperties = { fontSize: 18, color: 'var(--ink-2)', fontWeight: 700 };
const pillLink: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 'var(--r-pill)',
  fontSize: 14, fontWeight: 700, textDecoration: 'none',
};

function DashboardPageContent() {
  const { user } = useAuth();
  const { t, lang, money, weekdays } = useT();
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [week, setWeek] = useState<WeekMenu | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState<FinanceSummary | null>(null);

  // recipe names come back in the current language, so reload when it changes
  useEffect(() => {
    recipesApi.list().then(setRecipes).catch(() => setRecipes([]));
    menuApi.getWeek().then(setWeek).catch(() => setWeek(null));
    financeApi.summary(monthRange(today())).then(setMonth).catch(() => setMonth(null));
    const monday = startOfWeek(today());
    tasksApi.list(monday, addDays(monday, 6)).then(setTasks).catch(() => setTasks([]));
  }, [lang]);

  if (!user) return null;

  const name = user.firstName || (user.username ? `@${user.username}` : user.email);
  const recent = recipes?.slice(0, 5) ?? [];
  const doneTasks = tasks.filter((tk) => tk.done).length;
  const openTasks = tasks.length - doneTasks;
  const donePct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const plannedDays = week?.days.filter((d) => d.meals.length > 0).length ?? 0;
  const spentTotal = month?.expense ?? 0;
  const income = month?.income ?? 0;
  // share of this month's income already spent, shown as 20 segments
  const spentPct = income ? Math.min(100, Math.round((spentTotal / income) * 100)) : 0;
  const filledSegs = Math.round(spentPct / 5);
  const DAY_SHORT = weekdays('short');
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
  const biggest = month?.byCategory.find((c) => c.type === 'expense');
  const todayTasks = tasks.filter((tk) => tk.date === today()).slice(0, 5);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {/* hero: graphite greeting + lime budget */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section
          style={{
            flex: '2 1 520px', minWidth: 0, borderRadius: 'var(--r-lg)', padding: 'clamp(24px, 4vw, 36px)', minHeight: 260,
            background: 'var(--graphite)', color: 'var(--graphite-ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--graphite-ink-2)' }}>{t('dashboard.greeting')}</span>
            <h2 style={{ fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.04em', overflowWrap: 'anywhere' }}>{name}</h2>
            <p style={{ fontSize: 15, color: 'var(--graphite-ink-2)', maxWidth: '46ch' }}>{t('dashboard.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link href="/recipes/new" style={{ ...pillLink, background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              <Icon name="plus" size={16} strokeWidth={2.4} />
              {t('dashboard.addRecipe')}
            </Link>
            <Link href="/menu" style={{ ...pillLink, border: '1px solid var(--graphite-line)', color: 'var(--graphite-ink)' }}>
              {t('nav.food.menu')}
            </Link>
            <Link href="/future/plan" style={{ ...pillLink, border: '1px solid var(--graphite-line)', color: 'var(--graphite-ink)' }}>
              {t('nav.future.plan')}
            </Link>
          </div>
        </section>

        <section
          style={{
            flex: '1 1 320px', minWidth: 0, borderRadius: 'var(--r-lg)', padding: 28,
            background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ padding: '8px 14px', borderRadius: 'var(--r-pill)', background: '#1b1d18', color: '#ffffff', fontSize: 12, fontWeight: 700 }}>{t('dashboard.spendCard')}</span>
            <Link href="/finance/spending" aria-label={t('nav.finance.spending')} style={{ width: 48, height: 48, borderRadius: '50%', background: '#ffffff', color: '#1b1d18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow" size={18} strokeWidth={2.2} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('finance.expenseTotal')}</span>
            <span style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{money(spentTotal, 0)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div aria-hidden="true" style={{ display: 'flex', gap: 4, height: 14 }}>
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} style={{ flex: 1, borderRadius: 4, background: i < filledSegs ? '#1b1d18' : 'rgba(27,29,24,0.18)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>{spentPct}%</span>
              <span>
                {t('finance.incomeTotal')}: {money(income, 0)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={label}>{t('dashboard.mealsCard')}</span>
          <span style={bigNumber}>
            {plannedDays}
            <span style={unit}> / 7</span>
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
            {DAY_SHORT.map((d, i) => {
              const has = (week?.days[i]?.meals.length ?? 0) > 0;
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: '100%', height: has ? (isToday ? 42 : 34) : 12, borderRadius: 10, background: has ? (isToday ? 'var(--accent)' : 'var(--ink)') : 'var(--glass-2)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--ink)' : 'var(--ink-2)' }}>{d}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={label}>{t('future.thisWeek')}</span>
          <span style={bigNumber}>
            {doneTasks}
            <span style={unit}> / {tasks.length}</span>
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 10, borderRadius: 'var(--r-pill)', background: 'var(--glass-2)', overflow: 'hidden' }}>
              <div style={{ width: `${donePct}%`, height: '100%', borderRadius: 'var(--r-pill)', background: 'var(--ink)' }} />
            </div>
            <Link href="/future/plan" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
              {t('future.openCount', { count: openTasks })} →
            </Link>
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={label}>{t('dashboard.proteinCard')}</span>
          <span style={bigNumber}>{recipes?.length ?? 0}</span>
          <Link href="/recipes" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
            {recipes === null ? t('dashboard.foodLoading') : t('dashboard.viewRecipes')}
          </Link>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={label}>{t('finance.topCategory')}</span>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, overflowWrap: 'anywhere' }}>{biggest ? (biggest.name ?? t('finance.noCategory')) : '—'}</span>
          <span style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 'var(--r-pill)', background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 700 }}>{money(biggest?.total ?? 0, 0)}</span>
        </Card>
      </div>

      {/* week menu + recent recipes + today's tasks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <Card as="section" style={{ flex: '1.3 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('dashboard.weekPlanTitle')}</h2>
            <Link href="/menu" style={{ fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 'var(--r-pill)', background: 'var(--glass-2)', color: 'var(--ink)' }}>
              {t('nav.food.menu')}
            </Link>
          </div>
          {!week && <StateMsg>{t('common.loading')}</StateMsg>}
          {week?.days.map((d, i) => {
            const first = d.meals[0];
            const isToday = i === todayIdx;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10, borderRadius: 18, background: isToday ? 'var(--accent-tint)' : 'transparent' }}>
                <span
                  style={{
                    width: 44, height: 44, flex: '0 0 44px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, background: isToday ? 'var(--accent)' : 'var(--glass-2)', color: isToday ? 'var(--accent-ink)' : 'var(--ink)',
                  }}
                >
                  {DAY_SHORT[i]}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{first?.recipeName ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{d.meals.length > 1 ? t('dashboard.moreMeals', { count: d.meals.length - 1 }) : ''}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{d.total.calories ? t('units.kcal', { value: d.total.calories }) : '—'}</span>
              </div>
            );
          })}
        </Card>

        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ borderRadius: 'var(--r-lg)', padding: 24, background: 'var(--graphite)', color: 'var(--graphite-ink)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('future.today')}</h2>
              <Link href="/future/plan" aria-label={t('future.add')} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={16} strokeWidth={2.4} />
              </Link>
            </div>
            {todayTasks.length === 0 && <span style={{ fontSize: 14, color: 'var(--graphite-ink-2)' }}>{t('future.nothingPlanned')}</span>}
            {todayTasks.map((tk) => (
              <div key={tk.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'var(--graphite-2)' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 20, height: 20, flex: '0 0 20px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: tk.done ? 'var(--accent)' : 'transparent', border: `1.5px solid ${tk.done ? 'var(--accent)' : 'var(--graphite-ink-2)'}`, color: 'var(--accent-ink)',
                  }}
                >
                  {tk.done && <Icon name="plan" size={12} strokeWidth={3} />}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: tk.done ? 'var(--graphite-ink-2)' : 'var(--graphite-ink)', textDecoration: tk.done ? 'line-through' : 'none' }}>{tk.title}</span>
              </div>
            ))}
          </section>

          <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>{t('dashboard.recentTitle')}</h2>
            {recipes === null && <StateMsg>{t('common.loading')}</StateMsg>}
            {recipes && recipes.length === 0 && <EmptyState title={t('dashboard.emptyTitle')}>{t('dashboard.emptyBody')}</EmptyState>}
            {recent.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} data-row style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 10px', color: 'inherit' }}>
                <strong style={{ fontWeight: 700 }}>{r.name}</strong>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
            <Link href="/ingredients" style={{ alignSelf: 'flex-start', marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>
              {t('dashboard.ingredientsLink')} →
            </Link>
          </Card>
        </div>
      </div>
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
