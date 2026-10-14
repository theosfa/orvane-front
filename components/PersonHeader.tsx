'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

// top of a profile: avatar letter, name (if shown) and @username, when they joined,
// follower counts and an action on the right (follow / edit)
export default function PersonHeader({
  username,
  name,
  joinedAt,
  extra,
  counts,
  action,
}: {
  username: string;
  name: string | null;
  joinedAt: string;
  extra?: ReactNode;
  counts?: ReactNode;
  action?: ReactNode;
}) {
  const { t, format } = useT();
  const initial = (name ?? username)[0]?.toUpperCase() ?? '?';
  const joined = format.dateTime(new Date(joinedAt), { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, padding: 28 }}>
      <div style={{ width: 76, height: 76, flex: '0 0 76px', borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
        {initial}
      </div>
      <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <div data-testid="person-name" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', overflowWrap: 'anywhere' }}>
          {name ?? `@${username}`}
        </div>
        {name && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>@{username}</div>}
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          {t('profile.joined')} {joined}
        </div>
        {extra}
        {counts && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 6 }}>{counts}</div>}
      </div>
      {action && <div style={{ flex: '0 0 auto' }}>{action}</div>}
    </Card>
  );
}

// "12 Followers" — a number with its label; a button when it opens a list
export function Count({ value, label, onClick, active }: { value: number; label: string; onClick?: () => void; active?: boolean }) {
  const { format } = useT();
  const content = (
    <>
      <strong style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{format.number(value)}</strong> {label}
    </>
  );
  const style = { fontSize: 13, color: active ? 'var(--accent-deep)' : 'var(--ink-2)' } as const;
  return onClick ? (
    <button type="button" onClick={onClick} style={{ ...style, background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
      {content}
    </button>
  ) : (
    <span style={style}>{content}</span>
  );
}
