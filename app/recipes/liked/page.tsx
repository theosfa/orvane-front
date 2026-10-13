'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { recipesApi, RecipeListItem, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import LikeButton from '@/components/LikeButton';
import { useT } from '@/lib/i18n/context';
import { Card, ErrorMsg, StateMsg, EmptyState } from '@/components/ui';

function LikedPageContent() {
  const { t } = useT();
  const [liked, setLiked] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recipesApi.liked().then(setLiked).catch((err) => setError(err instanceof ApiError ? err.message : t('food.likedError')));
  }, [t]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      {!liked && !error && <StateMsg>{t('common.loading')}</StateMsg>}

      {liked && liked.length === 0 && <EmptyState title={t('food.likedEmptyTitle')}>{t('food.likedEmptyBody')}</EmptyState>}

      {liked && liked.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {liked.map((r) => (
            <Card key={r.id} as="article" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
              <Link href={`/recipes/${r.id}`} style={{ flex: 1, minWidth: 0, color: 'inherit' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>{r.name}</h3>
              </Link>
              <LikeButton recipeId={r.id} liked={r.liked} onChange={(v) => !v && setLiked((prev) => prev?.filter((x) => x.id !== r.id) ?? prev)} />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default function LikedPage() {
  return (
    <RequireAuth>
      <LikedPageContent />
    </RequireAuth>
  );
}
