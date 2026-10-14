'use client';

import Link from 'next/link';
import type { PublicUser } from '@/lib/api';

// how a person is shown to others: their name if they share it, otherwise @username;
// opens their public page
export const displayName = (u: PublicUser) => u.name ?? `@${u.username}`;

export const personHref = (username: string) => `/u/${encodeURIComponent(username)}`;

export default function AuthorLink({ author, style }: { author: PublicUser; style?: React.CSSProperties }) {
  return (
    <Link
      href={personHref(author.username)}
      data-testid="author-link"
      style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style }}
    >
      {displayName(author)}
    </Link>
  );
}
