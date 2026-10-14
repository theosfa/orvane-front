'use client';

import { useState } from 'react';
import { peopleApi, FollowState } from '@/lib/api';
import { Btn } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

// Follow / Unfollow someone; onChange gets the new state (with their follower count)
export default function FollowButton({
  username,
  followed,
  onChange,
  onError,
  compact = false,
}: {
  username: string;
  followed: boolean;
  onChange: (state: FollowState) => void;
  onError?: () => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      onChange(await (followed ? peopleApi.unfollow(username) : peopleApi.follow(username)));
    } catch {
      onError?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Btn
      variant={followed ? 'ghost' : 'primary'}
      onClick={toggle}
      disabled={busy}
      aria-pressed={followed}
      style={compact ? { padding: '8px 14px' } : undefined}
    >
      {followed ? t('people.unfollow') : t('people.follow')}
    </Btn>
  );
}
