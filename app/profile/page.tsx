'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, statsApi, RecipeListItem, UserStats, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import FamilySection from '@/components/FamilySection';
import { useFamily } from '@/lib/family-context';
import { useFamilyLive } from '@/lib/family-live';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, Grid, ErrorMsg, StateMsg, EmptyState } from '@/components/ui';
import { LANGUAGES, LANGUAGE_NAMES, Language } from '@/lib/i18n/languages';

function ProfilePageContent() {
  const { user, logout, updateLanguage } = useAuth();
  const router = useRouter();
  const { t, lang, format } = useT();
  const { overview } = useFamily();
  const [liked, setLiked] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [langError, setLangError] = useState<string | null>(null);

  const changeLanguage = (next: Language) => {
    if (next === lang) return;
    setLangError(null);
    updateLanguage(next).catch(() => setLangError(t('profile.languageSaveError')));
  };

  useEffect(() => {
    recipesApi.liked().then(setLiked).catch((err) => setError(err instanceof ApiError ? err.message : t('profile.likedError')));
  }, [t]);

  const loadStats = useCallback(() => {
    statsApi
      .mine()
      .then((s) => {
        setStats(s);
        setStatsError(false);
      })
      .catch(() => setStatsError(true));
  }, []);
  useEffect(loadStats, [loadStats]);
  // family menu or plans changed — the user may have been the one who planned or finished something
  useFamilyLive('menu', loadStats);
  useFamilyLive('tasks', loadStats);

  if (!user) return null;

  const initial = user.email[0]?.toUpperCase() ?? '?';
  const joined = format.dateTime(new Date(user.createdAt), { year: 'numeric', month: 'long', day: 'numeric' });

  const family = overview?.family ?? null;

  const statCards: { label: string; value: number | undefined; href: string }[] = [
    { label: t('profile.statsRecipes'), value: stats?.recipesWritten, href: '/recipes' },
    { label: t('profile.statsLiked'), value: stats?.recipesLiked, href: '/recipes/liked' },
    { label: t('profile.statsWeeks'), value: stats?.weeksPlanned, href: '/menu' },
    { label: t('profile.statsTasks'), value: stats?.tasksDone, href: '/future/plan' },
  ];

  // features that really link the apps
  const connections = ['menuPlans', 'plansFinance', 'financeFamily', 'family'] as const;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40, width: '100%' }}>
      <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, padding: 28 }}>
        <div style={{ width: 76, height: 76, flex: '0 0 76px', borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
          {initial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', wordBreak: 'break-all' }}>{user.email}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('profile.joined')} {joined}</div>
          {family && (
            <a href="#family" data-testid="profile-family" style={{ fontSize: 13, fontWeight: 700 }}>
              {t('profile.familyLine', { name: family.name, role: t(`family.role.${family.myRole}`) })}
            </a>
          )}
        </div>
      </Card>

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{t('profile.settingsTitle')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t('profile.languageLabel')}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('profile.languageHint')}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map((code) => (
              <Chip key={code} active={lang === code} onClick={() => changeLanguage(code)}>
                {LANGUAGE_NAMES[code]}
              </Chip>
            ))}
          </div>
        </div>
        {langError && <ErrorMsg>{langError}</ErrorMsg>}
      </Card>

      {statsError && <ErrorMsg>{t('profile.statsError')}</ErrorMsg>}
      <Grid min={160}>
        {statCards.map((c) => (
          <Link key={c.href} href={c.href} style={{ color: 'inherit' }}>
            <Card style={{ height: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{c.label}</div>
              <div data-testid="profile-stat" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>
                {c.value === undefined ? '—' : format.number(c.value)}
              </div>
            </Card>
          </Link>
        ))}
      </Grid>

      <Grid min={320} style={{ alignItems: 'start' }}>
        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{t('profile.connectionsTitle')}</h2>
          {connections.map((c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 10px' }}>
              <div style={{ flex: '0 0 auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 4, background: 'var(--glass-2)', border: '1px solid var(--stroke-2)' }}>
                {t(`profile.connections.${c}.pair`)}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{t(`profile.connections.${c}.text`)}</div>
            </div>
          ))}
        </Card>

        <FamilySection />
      </Grid>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>{t('profile.likedTitle')}</h2>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {!liked && !error && <StateMsg>{t('common.loading')}</StateMsg>}
        {liked && liked.length === 0 && <EmptyState title={t('profile.likedEmptyTitle')}>{t('profile.likedEmptyBody')}</EmptyState>}
        {liked && liked.length > 0 && (
          <Card style={{ padding: '4px 20px' }}>
            {liked.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: '1px solid var(--stroke-2)', color: 'inherit' }}>
                <strong>{r.name}</strong>
                <span style={{ color: 'var(--ink-2)' }}>→</span>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <Btn
        onClick={() => {
          logout();
          router.push('/');
        }}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('profile.logout')}
      </Btn>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfilePageContent />
    </RequireAuth>
  );
}
