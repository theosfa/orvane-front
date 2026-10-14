'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { peopleApi, recipesApi, statsApi, ApiError, PersonProfile, RecipeListItem, UserStats } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import FamilySection from '@/components/FamilySection';
import RecipeGrid from '@/components/RecipeGrid';
import PersonHeader, { Count } from '@/components/PersonHeader';
import { personHref } from '@/components/AuthorLink';
import { useFamily } from '@/lib/family-context';
import { useFamilyLive } from '@/lib/family-live';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Chip, Grid, ErrorMsg, StateMsg, EmptyState, GlassInput, Field } from '@/components/ui';
import { LANGUAGES, LANGUAGE_NAMES, Language } from '@/lib/i18n/languages';

const TABS = ['public', 'private', 'family', 'settings'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL = { public: 'profile.tabPublic', private: 'profile.tabPrivate', family: 'profile.tabFamily', settings: 'profile.tabSettings' } as const;

const isTab = (v: string | null): v is Tab => TABS.includes(v as Tab);

function ProfilePageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, format } = useT();
  const { overview } = useFamily();

  // the open section lives in the URL (?tab=…), so links like the invite notice can open one
  const fromUrl = searchParams?.get('tab') ?? null;
  const tab: Tab = isTab(fromUrl) ? fromUrl : 'public';
  const openTab = (next: Tab) => router.replace(next === 'public' ? '/profile' : `/profile?tab=${next}`, { scroll: false });

  const [me, setMe] = useState<PersonProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsError, setStatsError] = useState(false);

  // my public page as others see it: public recipes and follower counts
  const username = user?.username;
  useEffect(() => {
    if (username) peopleApi.profile(username).then(setMe).catch(() => setMe(null));
  }, [username]);

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

  const family = overview?.family ?? null;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || null;

  const statCards: { label: string; value: number | undefined; href: string }[] = [
    { label: t('profile.statsRecipes'), value: stats?.recipesWritten, href: '/recipes' },
    { label: t('profile.statsLiked'), value: stats?.recipesLiked, href: '/recipes/liked' },
    { label: t('profile.statsWeeks'), value: stats?.weeksPlanned, href: '/menu' },
    { label: t('profile.statsTasks'), value: stats?.tasksDone, href: '/future/plan' },
  ];

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40, width: '100%' }}>
      <PersonHeader
        username={user.username}
        name={fullName}
        joinedAt={user.createdAt}
        extra={
          family && (
            <button type="button" data-testid="profile-family" onClick={() => openTab('family')} style={{ alignSelf: 'flex-start', background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>
              {t('profile.familyLine', { name: family.name, role: t(`family.role.${family.myRole}`) })}
            </button>
          )
        }
        counts={
          me && (
            <>
              <Count value={me.followers} label={t('people.followers')} />
              <Count value={me.following} label={t('people.following')} />
            </>
          )
        }
        action={
          <Link href={personHref(user.username)}>
            <Btn>{t('profile.viewPublic')}</Btn>
          </Link>
        }
      />

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

      <Card style={{ padding: 6 }}>
        <div role="tablist" aria-label={t('profile.tabsLabel')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
          {TABS.map((id) => (
            <Chip key={id} role="tab" aria-selected={tab === id} active={tab === id} onClick={() => openTab(id)} style={{ padding: '11px 14px' }}>
              {t(TAB_LABEL[id])}
            </Chip>
          ))}
        </div>
      </Card>

      <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {tab === 'public' && <PublicRecipes me={me} setMe={setMe} />}
        {tab === 'private' && <PrivateRecipes />}
        {tab === 'family' && <FamilySection />}
        {tab === 'settings' && <Settings />}
      </div>
    </main>
  );
}

// what others see on my page
function PublicRecipes({ me, setMe }: { me: PersonProfile | null; setMe: (fn: (p: PersonProfile | null) => PersonProfile | null) => void }) {
  const { t } = useT();
  if (!me) return <StateMsg>{t('common.loading')}</StateMsg>;
  if (!me.recipes.length) return <EmptyState title={t('profile.publicEmptyTitle')}>{t('profile.publicEmptyBody')}</EmptyState>;
  return (
    <RecipeGrid
      recipes={me.recipes}
      showAuthor={false}
      onLikedChange={(id, liked) => setMe((p) => p && { ...p, recipes: p.recipes.map((r) => (r.id === id ? { ...r, liked } : r)) })}
    />
  );
}

// only I see these
function PrivateRecipes() {
  const { t } = useT();
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    recipesApi
      .list()
      .then((all) => setRecipes(all.filter((r) => r.isMine && !r.isPublic)))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorMsg>{t('profile.recipesError')}</ErrorMsg>;
  if (!recipes) return <StateMsg>{t('common.loading')}</StateMsg>;
  if (!recipes.length) return <EmptyState title={t('profile.privateEmptyTitle')}>{t('profile.privateEmptyBody')}</EmptyState>;
  return (
    <RecipeGrid
      recipes={recipes}
      showAuthor={false}
      onLikedChange={(id, liked) => setRecipes((prev) => prev?.map((r) => (r.id === id ? { ...r, liked } : r)) ?? prev)}
    />
  );
}

function Settings() {
  const { user, logout, updateLanguage, updateProfile } = useAuth();
  const router = useRouter();
  const { t, lang } = useT();
  const [langError, setLangError] = useState<string | null>(null);

  const [username, setUsername] = useState(user?.username ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [showFullName, setShowFullName] = useState(user?.showFullName ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!user) return null;

  const changeLanguage = (next: Language) => {
    if (next === lang) return;
    setLangError(null);
    updateLanguage(next).catch(() => setLangError(t('profile.languageSaveError')));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const nick = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(nick)) {
      setSaveError(t('profile.usernameInvalid'));
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await updateProfile({ username: nick, firstName: firstName.trim(), lastName: lastName.trim(), showFullName });
      setUsername(nick);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError && err.status === 409
          ? t('profile.usernameTaken')
          : err instanceof ApiError && err.status === 400
            ? t('profile.usernameInvalid')
            : t('profile.profileSaveError'),
      );
    } finally {
      setSaving(false);
    }
  };

  // features that really link the apps
  const connections = ['menuPlans', 'plansFinance', 'financeFamily', 'family'] as const;

  return (
    <>
      <Card as="section">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>{t('profile.nameTitle')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Field label={t('profile.usernameLabel')}>
              <GlassInput value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} autoCapitalize="none" spellCheck={false} aria-describedby="username-hint" />
            </Field>
            <span id="username-hint" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('profile.usernameHint')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Field label={t('profile.firstNameLabel')}>
              <GlassInput value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} autoComplete="given-name" />
            </Field>
            <Field label={t('profile.lastNameLabel')}>
              <GlassInput value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} autoComplete="family-name" />
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={showFullName} onChange={(e) => setShowFullName(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
            <span>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{t('profile.showFullNameLabel')}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('profile.showFullNameHint', { username: user.username })}</span>
            </span>
          </label>
          {saveError && <ErrorMsg>{saveError}</ErrorMsg>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Btn type="submit" variant="primary" disabled={saving}>
              {t('common.save')}
            </Btn>
            {saved && <span role="status" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>{t('profile.profileSaved')}</span>}
          </div>
        </form>
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

      <Btn
        onClick={() => {
          logout();
          router.push('/');
        }}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('profile.logout')}
      </Btn>
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      {/* useSearchParams needs a Suspense boundary */}
      <Suspense>
        <ProfilePageContent />
      </Suspense>
    </RequireAuth>
  );
}
