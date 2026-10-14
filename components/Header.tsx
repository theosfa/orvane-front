'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';

function usePageMeta() {
  const pathname = usePathname() ?? '/';
  const { t } = useT();

  const food = t('nav.food.name');
  const finance = t('nav.finance.name');
  const future = t('nav.future.name');

  if (pathname === '/') return { kicker: t('brand.name'), title: t('landing.heroTitle').split(' ').slice(0, 3).join(' ') };
  if (pathname === '/login') return { kicker: t('brand.name'), title: t('nav.login') };
  if (pathname === '/register') return { kicker: t('brand.name'), title: t('nav.register') };
  if (pathname === '/dashboard') return { kicker: t('dashboard.kicker'), title: t('dashboard.title') };
  if (pathname === '/recipes/new') return { kicker: food, title: t('nav.food.newRecipe') };
  if (pathname === '/recipes/liked') return { kicker: food, title: t('nav.food.liked') };
  if (pathname === '/recipes/feed') return { kicker: food, title: t('nav.food.feed') };
  if (pathname?.startsWith('/recipes/')) return { kicker: food, title: t('nav.food.recipes') };
  if (pathname === '/recipes') return { kicker: food, title: t('nav.food.recipes') };
  if (pathname === '/ingredients') return { kicker: `${food} × ${finance}`, title: t('nav.food.ingredients') };
  if (pathname === '/menu') return { kicker: food, title: t('nav.food.menu') };
  if (pathname === '/future/plan') return { kicker: future, title: t('nav.future.plan') };
  if (pathname === '/future/goals') return { kicker: future, title: t('nav.future.goals') };
  if (pathname === '/finance/spending') return { kicker: finance, title: t('nav.finance.spending') };
  if (pathname === '/finance/wallets') return { kicker: finance, title: t('nav.finance.wallets') };
  if (pathname === '/finance/categories') return { kicker: finance, title: t('nav.finance.categories') };
  if (pathname === '/profile') return { kicker: t('brand.name'), title: t('nav.profile') };
  return { kicker: t('brand.name'), title: '' };
}

export default function Header() {
  const { user } = useAuth();
  const { t } = useT();
  const { theme, setTheme } = useTheme();
  const { kicker, title } = usePageMeta();
  const initial = user?.email[0]?.toUpperCase() ?? '?';

  return (
    <header
      style={{
        position: 'sticky', top: 16, zIndex: 30, width: '100%', maxWidth: 1180, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16,
        padding: '12px 12px 12px 20px', borderRadius: 8,
        background: 'var(--glass)', WebkitBackdropFilter: 'blur(26px) saturate(180%)', backdropFilter: 'blur(26px) saturate(180%)',
        border: '1px solid var(--stroke)', boxShadow: 'var(--shadow)',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, color: 'inherit' }}>
        <div style={{ width: 34, height: 34, borderRadius: 4, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', flex: '0 0 auto' }}>
          Л
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{kicker}</div>
        </div>
      </Link>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 4, background: 'var(--glass-2)', border: '1px solid var(--stroke-2)' }}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '7px 14px', borderRadius: 4, background: theme === 'light' ? 'var(--ink)' : 'transparent', color: theme === 'light' ? 'var(--bg)' : 'var(--ink)', border: 0, cursor: 'pointer' }}
          >
            {t('common.day')}
          </button>
          <button
            type="button"
            onClick={() => setTheme('ink')}
            style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '7px 14px', borderRadius: 4, background: theme === 'ink' ? 'var(--ink)' : 'transparent', color: theme === 'ink' ? 'var(--bg)' : 'var(--ink)', border: 0, cursor: 'pointer' }}
          >
            {t('common.night')}
          </button>
        </div>

        {user ? (
          <Link
            href="/profile"
            style={{ width: 38, height: 38, borderRadius: 4, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flex: '0 0 auto' }}
          >
            {initial}
          </Link>
        ) : (
          <Link
            href="/login"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', padding: '10px 16px', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-ink)', flex: '0 0 auto' }}
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
