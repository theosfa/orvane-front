'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFamily } from '@/lib/family-context';
import { useT } from '@/lib/i18n/context';

// "You're invited to a family": slides down at the top centre when an invitation arrives
// (live, or found on the next visit), hides after 10 s. Each invitation is shown once;
// the button leads to the profile, where it's accepted or declined.
const SHOW_MS = 10_000;
const AFTER_HOVER_MS = 3_000; // once the pointer leaves it
const LEAVE_MS = 260; // the slide-up before it's removed
const SEEN_KEY = 'nn_seen_invites';

function readSeen(): number[] {
  try {
    const ids = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

function markSeen(ids: number[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // not remembered: it may show again on the next visit, fine
  }
}

export default function InviteToast() {
  const { t } = useT();
  const { overview } = useFamily();
  const pathname = usePathname();
  const invitations = overview?.invitations ?? [];
  const onProfile = pathname === '/profile';

  const [shownId, setShownId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wasHovered = useRef(false);

  // take the next invitation not shown yet; on the profile they're in plain sight already
  useEffect(() => {
    if (shownId !== null) return;
    const seen = readSeen();
    const fresh = invitations.filter((i) => !seen.includes(i.id));
    if (!fresh.length) return;
    if (onProfile) return markSeen([...seen, ...fresh.map((i) => i.id)]);
    markSeen([...seen, fresh[0].id]);
    setLeaving(false);
    wasHovered.current = false;
    setShownId(fresh[0].id);
  }, [invitations, onProfile, shownId]);

  const invitation = invitations.find((i) => i.id === shownId);

  const hide = () => setLeaving(true);

  // after the slide-up, make room for the next one
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setShownId(null), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  // cancelled meanwhile, or the user went to the profile
  useEffect(() => {
    if (shownId !== null && (!invitation || onProfile)) hide();
  }, [shownId, invitation, onProfile]);

  // 10 s on screen; hovering keeps it there, then it goes a little after the pointer leaves
  useEffect(() => {
    if (shownId === null || leaving) return;
    if (hovered) {
      wasHovered.current = true;
      return;
    }
    const timer = setTimeout(hide, wasHovered.current ? AFTER_HOVER_MS : SHOW_MS);
    return () => clearTimeout(timer);
  }, [shownId, leaving, hovered]);

  if (shownId === null || !invitation) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="invite-toast"
      className="invite-toast"
      data-leaving={leaving ? '1' : '0'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ flex: '0 0 34px', width: 34, height: 34, borderRadius: 4, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}>
        ◍
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('family.inviteToastTitle')}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('family.invitationText', { family: invitation.familyName, by: invitation.invitedBy })}
        </div>
      </div>
      <Link
        href="/profile#family"
        data-btn="primary"
        onClick={hide}
        style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', padding: '10px 14px', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        {t('family.inviteToastOpen')}
      </Link>
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={hide}
        style={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: 4, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
}
