'use client';

import Link from 'next/link';
import type { RecipeListItem } from '@/lib/api';
import LikeButton from '@/components/LikeButton';
import AuthorLink from '@/components/AuthorLink';
import { Card, Pill } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

// recipe cards: name, author, like, privacy and calories. showAuthor = false on a page that is
// already one author's (their profile)
export default function RecipeGrid({
  recipes,
  onLikedChange,
  showAuthor = true,
}: {
  recipes: RecipeListItem[];
  onLikedChange: (id: number, liked: boolean) => void;
  showAuthor?: boolean;
}) {
  const { t } = useT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
      {recipes.map((r) => (
        <Card key={r.id} as="article" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link href={`/recipes/${r.id}`} style={{ color: 'inherit' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.025em' }}>{r.name}</h3>
              </Link>
              {showAuthor && r.author && <AuthorLink author={r.author} />}
            </div>
            <LikeButton recipeId={r.id} liked={r.liked} onChange={(liked) => onLikedChange(r.id, liked)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
            <Link href={`/recipes/${r.id}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>
              {t('food.viewRecipe')} →
            </Link>
            <div style={{ display: 'flex', gap: 6 }}>
              {!r.isPublic && <Pill>{t('food.private')}</Pill>}
              <Pill>{t('units.kcal', { value: r.calories })}</Pill>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
