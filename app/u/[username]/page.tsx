'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { peopleApi, ApiError, PersonProfile, PersonListItem } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import RecipeGrid from '@/components/RecipeGrid';
import FollowButton from '@/components/FollowButton';
import PersonHeader, { Count } from '@/components/PersonHeader';
import { displayName, personHref } from '@/components/AuthorLink';
import { useT } from '@/lib/i18n/context';
import { Btn, Card, Chip, EmptyState, ErrorMsg, StateMsg } from '@/components/ui';

type View = 'recipes' | 'followers' | 'following';

// someone's public page: their public recipes, who follows them and whom they follow
function PersonPageContent() {
  const { t } = useT();
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params?.username ?? '');
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('recipes');
  const [people, setPeople] = useState<PersonListItem[] | null>(null);

  useEffect(() => {
    setPerson(null);
    setError(null);
    setView('recipes');
    peopleApi
      .profile(username)
      .then(setPerson)
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? t('people.notFound') : t('people.loadError')));
  }, [username, t]);

  const loadPeople = useCallback(
    (which: 'followers' | 'following') => {
      setPeople(null);
      (which === 'followers' ? peopleApi.followers(username) : peopleApi.following(username))
        .then(setPeople)
        .catch(() => setError(t('people.loadError')));
    },
    [username, t],
  );

  useEffect(() => {
    if (view !== 'recipes') loadPeople(view);
  }, [view, loadPeople]);

  if (error && !person) return <ErrorMsg>{error}</ErrorMsg>;
  if (!person) return <StateMsg>{t('common.loading')}</StateMsg>;

  const setLiked = (id: number, liked: boolean) =>
    setPerson((p) => p && { ...p, recipes: p.recipes.map((r) => (r.id === id ? { ...r, liked } : r)) });

  const followError = () => setError(t('people.followError'));

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40, width: '100%' }}>
      <PersonHeader
        username={person.username}
        name={person.name}
        joinedAt={person.joinedAt}
        counts={
          <>
            <Count value={person.recipes.length} label={t('people.recipes')} onClick={() => setView('recipes')} active={view === 'recipes'} />
            <Count value={person.followers} label={t('people.followers')} onClick={() => setView('followers')} active={view === 'followers'} />
            <Count value={person.following} label={t('people.following')} onClick={() => setView('following')} active={view === 'following'} />
          </>
        }
        action={
          person.isMe ? (
            <Link href="/profile?tab=settings">
              <Btn>{t('people.editProfile')}</Btn>
            </Link>
          ) : (
            <FollowButton
              username={person.username}
              followed={person.followedByMe}
              onChange={(s) => {
                setPerson((p) => p && { ...p, ...s });
                if (view === 'followers') loadPeople('followers');
              }}
              onError={followError}
            />
          )
        }
      />

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(['recipes', 'followers', 'following'] as const).map((v) => (
          <Chip key={v} role="tab" aria-selected={view === v} active={view === v} onClick={() => setView(v)}>
            {t(`people.${v}`)}
          </Chip>
        ))}
      </div>

      {view === 'recipes' &&
        (person.recipes.length ? (
          <RecipeGrid recipes={person.recipes} onLikedChange={setLiked} showAuthor={false} />
        ) : (
          <EmptyState title={t('people.noRecipes')} />
        ))}

      {view !== 'recipes' && !people && <StateMsg>{t('common.loading')}</StateMsg>}
      {view !== 'recipes' && people?.length === 0 && (
        <EmptyState title={view === 'followers' ? t('people.noFollowers') : t('people.noFollowing')} />
      )}
      {view !== 'recipes' && people && people.length > 0 && (
        <Card style={{ padding: '4px 20px' }}>
          {people.map((p) => (
            <div key={p.username} data-testid="person-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--stroke-2)' }}>
              <Link href={personHref(p.username)} style={{ flex: 1, minWidth: 0, color: 'inherit' }}>
                <strong>{displayName(p)}</strong>
                {p.name && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-2)' }}>@{p.username}</span>}
              </Link>
              {p.isMe ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{t('people.you')}</span>
              ) : (
                <FollowButton
                  compact
                  username={p.username}
                  followed={p.followedByMe}
                  onError={followError}
                  onChange={(s) => setPeople((list) => list?.map((x) => (x.username === p.username ? { ...x, followedByMe: s.followedByMe } : x)) ?? list)}
                />
              )}
            </div>
          ))}
        </Card>
      )}
    </main>
  );
}

export default function PersonPage() {
  return (
    <RequireAuth>
      <PersonPageContent />
    </RequireAuth>
  );
}
