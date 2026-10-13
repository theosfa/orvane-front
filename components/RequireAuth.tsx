'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { StateMsg } from '@/components/ui';

// Gate for every page that isn't the public landing page. Unauthenticated
// visitors get redirected to /login instead of seeing the page content.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <StateMsg>{t('common.loading')}</StateMsg>;
  }

  return <>{children}</>;
}
