'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { recipesApi, Recipe } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import LikeButton from '@/components/LikeButton';
import { useT } from '@/lib/i18n/context';
import { Btn, EmptyState, ErrorMsg, StateMsg } from '@/components/ui';

const BATCH = 5; // recipes per request
const PREFETCH = 2; // load more when this many cards are left
const MAX_INGREDIENTS = 6;
const MAX_STEPS = 2;

// the same recipe always gets the same colours
const hueFor = (id: number) => (id * 47) % 360;

type Item = { key: string; recipe: Recipe };

function FeedCard({ recipe, showHint }: { recipe: Recipe; showHint: boolean }) {
  const { t } = useT();
  const hue = hueFor(recipe.id);
  const steps = [...recipe.steps].sort((a, b) => a.stepNum - b.stepNum);
  const glass = { background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)' };

  return (
    <article
      style={{
        position: 'relative', width: '100%', maxWidth: 480, height: '100%', borderRadius: 8, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 16, padding: '22px 76px 22px 22px',
        background: `linear-gradient(160deg, hsl(${hue} 55% 42%) 0%, hsl(${(hue + 40) % 360} 60% 24%) 100%)`,
        color: '#fff', boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* big faint first letter as the card's "picture" until recipes have photos */}
      <div aria-hidden style={{ position: 'absolute', top: -40, right: -20, fontSize: 260, fontWeight: 900, lineHeight: 1, opacity: 0.12, pointerEvents: 'none' }}>
        {recipe.name.charAt(0).toUpperCase()}
      </div>

      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
        <span style={{ ...glass, padding: '6px 12px', borderRadius: 4 }}>{t('units.kcal', { value: Math.round(recipe.total.calories) })}</span>
        <span style={{ opacity: 0.85 }}>
          {t('units.macros', { protein: Math.round(recipe.total.protein), fat: Math.round(recipe.total.fat), carbs: Math.round(recipe.total.carbs) })}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 }}>{recipe.name}</h2>
        {recipe.autoTranslated && <span style={{ fontSize: 11, opacity: 0.7 }}>{t('food.autoTranslated')}</span>}
      </div>

      {recipe.ingredients.length > 0 && (
        <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>
            {t('feed.ingredients')} · {t('food.forPeople', { count: recipe.servings })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recipe.ingredients.slice(0, MAX_INGREDIENTS).map((ri) => (
              <span key={ri.ingredientId} style={{ ...glass, padding: '5px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ri.name}
              </span>
            ))}
            {recipe.ingredients.length > MAX_INGREDIENTS && (
              <span style={{ padding: '5px 4px', fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                {t('feed.moreIngredients', { count: recipe.ingredients.length - MAX_INGREDIENTS })}
              </span>
            )}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>{t('feed.steps')}</div>
          {steps.slice(0, MAX_STEPS).map((s) => (
            <div key={s.stepNum} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.4 }}>
              <span style={{ ...glass, flex: '0 0 22px', height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{s.stepNum}</span>
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.stepText}</span>
            </div>
          ))}
          {steps.length > MAX_STEPS && <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>{t('feed.moreSteps', { count: steps.length - MAX_STEPS })}</span>}
        </section>
      )}

      <Link
        href={`/recipes/${recipe.id}`}
        style={{ position: 'relative', alignSelf: 'flex-start', padding: '11px 18px', borderRadius: 6, background: '#fff', color: `hsl(${hue} 60% 24%)`, fontSize: 13, fontWeight: 800 }}
      >
        {t('feed.openRecipe')} →
      </Link>

      {/* action rail on the right, like in Reels/TikTok */}
      <div style={{ position: 'absolute', right: 14, bottom: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <LikeButton recipeId={recipe.id} liked={recipe.liked} size={50} />
      </div>

      {showHint && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center', fontSize: 11, fontWeight: 700, opacity: 0.75, animation: 'feed-hint 1.6s ease-in-out infinite' }}>
          ↓ {t('feed.hint')}
        </div>
      )}
    </article>
  );
}

function FeedPageContent() {
  const { t, lang } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const seen = useRef(new Set<number>()); // ids shown in the current round
  const round = useRef(0);
  const loading = useRef(false);
  const generation = useRef(0); // bumped on reset so answers to old requests are dropped

  const loadMore = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    const gen = generation.current;
    try {
      let batch = await recipesApi.feed(Array.from(seen.current), BATCH);
      if (!batch.length && seen.current.size) {
        // every public recipe was shown — reshuffle and go again, but not the last one straight away
        seen.current = new Set();
        round.current += 1;
        const lastId = itemsRef.current.at(-1)?.recipe.id;
        batch = await recipesApi.feed(lastId ? [lastId] : [], BATCH);
        if (!batch.length) batch = await recipesApi.feed([], BATCH); // only one public recipe exists
      }
      if (gen !== generation.current) return;

      batch.forEach((r) => seen.current.add(r.id));
      const next = [...itemsRef.current, ...batch.map((recipe) => ({ key: `${round.current}-${recipe.id}`, recipe }))];
      setItems(next);
      setStatus(next.length ? 'ready' : 'empty');
    } catch {
      if (gen === generation.current && !itemsRef.current.length) setStatus('error');
    } finally {
      if (gen === generation.current) loading.current = false;
    }
  }, []);

  // start over on open and when the language changes (names and steps come back translated)
  useEffect(() => {
    generation.current += 1;
    loading.current = false;
    seen.current = new Set();
    round.current = 0;
    setItems([]);
    setIndex(0);
    setStatus('loading');
    scroller.current?.scrollTo({ top: 0 });
    loadMore();
  }, [lang, loadMore]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index) setIndex(i);
    if (i >= items.length - PREFETCH) loadMore();
  };

  // keyboard: ↓ / ↑ (also j / k, PageDown / PageUp) move one card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scroller.current;
      if (!el || (e.target as HTMLElement)?.closest('input, textarea, select')) return;
      const dir = ['ArrowDown', 'PageDown', 'j'].includes(e.key) ? 1 : ['ArrowUp', 'PageUp', 'k'].includes(e.key) ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // header floats over the top of the cards and the dock over the bottom
  const slide = { height: '100%', padding: '104px 16px 118px', display: 'flex', justifyContent: 'center' } as const;

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      style={{ position: 'fixed', inset: 0, zIndex: 2, overflowY: 'auto', scrollSnapType: 'y mandatory', overscrollBehavior: 'contain', scrollbarWidth: 'none' }}
    >
      <style>{'@keyframes feed-hint { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(5px) } }'}</style>

      {status !== 'ready' && (
        <div style={{ ...slide, alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {status === 'loading' && <StateMsg>{t('common.loading')}</StateMsg>}
            {status === 'empty' && <EmptyState title={t('feed.emptyTitle')}>{t('feed.emptyBody')}</EmptyState>}
            {status === 'error' && (
              <>
                <ErrorMsg>{t('feed.error')}</ErrorMsg>
                <Btn onClick={() => { setStatus('loading'); loadMore(); }} style={{ alignSelf: 'flex-start' }}>{t('feed.retry')}</Btn>
              </>
            )}
          </div>
        </div>
      )}

      {status === 'ready' &&
        items.map((item, i) => (
          <div key={item.key} style={{ ...slide, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
            <FeedCard recipe={item.recipe} showHint={i === 0 && index === 0} />
          </div>
        ))}
    </div>
  );
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <FeedPageContent />
    </RequireAuth>
  );
}
