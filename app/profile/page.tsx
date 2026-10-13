'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, RecipeListItem, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, Grid, ErrorMsg, StateMsg, EmptyState } from '@/components/ui';
import { LANGUAGES, LANGUAGE_NAMES, Language } from '@/lib/i18n/languages';

function ProfilePageContent() {
  const { user, logout, updateLanguage } = useAuth();
  const router = useRouter();
  const { t, lang, list, format } = useT();
  const [liked, setLiked] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [langError, setLangError] = useState<string | null>(null);

  const changeLanguage = (next: Language) => {
    if (next === lang) return;
    setLangError(null);
    updateLanguage(next).catch(() => setLangError(t('profile.languageSaveError')));
  };

  useEffect(() => {
    recipesApi.liked().then(setLiked).catch((err) => setError(err instanceof ApiError ? err.message : t('profile.likedError')));
  }, [t]);

  if (!user) return null;

  const initial = user.email[0]?.toUpperCase() ?? '?';
  const joined = format.dateTime(new Date(user.createdAt), { year: 'numeric', month: 'long', day: 'numeric' });

  const statLabels = [t('profile.statsRecipes'), t('profile.statsSaved'), t('profile.statsWeeks'), t('profile.statsWaste')];
  const statValues = list<string>('profile.statsSeed');
  const connections = list<{ pair: string; text: string; on: boolean }>('profile.connectionsSeed');
  const household = list<{ initials: string; name: string; note: string }>('profile.householdSeed');

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40, width: '100%' }}>
      <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, padding: 28 }}>
        <div style={{ width: 76, height: 76, flex: '0 0 76px', borderRadius: 24, background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
          {initial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', wordBreak: 'break-all' }}>{user.email}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('profile.joined')} {joined}</div>
        </div>
        <Btn style={{ marginLeft: 'auto' }}>{t('profile.edit')}</Btn>
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

      <Grid min={160}>
        {statLabels.map((label, i) => (
          <Card key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>{statValues[i] ?? '—'}</div>
          </Card>
        ))}
      </Grid>

      <Grid min={320} style={{ alignItems: 'start' }}>
        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{t('profile.connectionsTitle')}</h2>
          {connections.map((c) => (
            <div key={c.pair} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 10px' }}>
              <div style={{ flex: '0 0 auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 999, background: 'var(--glass-2)', border: '1px solid var(--stroke-2)' }}>{c.pair}</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{c.text}</div>
              <div style={{ flex: '0 0 auto', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.on ? 'var(--accent)' : 'var(--ink-2)' }}>
                {c.on ? t('common.on') : t('common.off')}
              </div>
            </div>
          ))}
        </Card>

        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{t('profile.householdTitle')}</h2>
          {household.map((h) => (
            <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10 }}>
              <div style={{ width: 38, height: 38, flex: '0 0 38px', borderRadius: 13, background: 'var(--glass-2)', border: '1px solid var(--stroke-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{h.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{h.note}</div>
              </div>
            </div>
          ))}
          <Btn style={{ alignSelf: 'flex-start', marginTop: 10 }}>{t('profile.invite')}</Btn>
        </Card>
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
