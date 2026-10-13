'use client';

import { useState } from 'react';
import { recipesApi } from '@/lib/api';

type Props = {
  recipeId: number;
  liked: boolean;
  onChange?: (liked: boolean) => void;
  size?: number; // diameter in px; the feed uses a bigger one
};

// Toggles a recipe's liked state. Safe to nest inside a <Link> (recipe cards) —
// clicks are stopped from bubbling into the surrounding navigation.
export default function LikeButton({ recipeId, liked: initialLiked, onChange, size = 32 }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !liked;
    setBusy(true);
    setLiked(next);
    try {
      const res = next ? await recipesApi.like(recipeId) : await recipesApi.unlike(recipeId);
      setLiked(res.liked);
      onChange?.(res.liked);
    } catch {
      setLiked(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? 'unlike' : 'like'}
      style={{
        flexShrink: 0, width: size, height: size, borderRadius: '50%', border: '1px solid var(--stroke-2)',
        background: liked ? 'var(--accent-tint)' : 'var(--glass-2)', color: liked ? 'var(--accent-deep)' : 'var(--ink-2)',
        fontSize: Math.round(size * 0.47), lineHeight: 1, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .1s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {liked ? '♥' : '♡'}
    </button>
  );
}
