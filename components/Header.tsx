'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';
import { Icon } from '@/components/icons';

function usePageMeta() {
  const pathname = usePathname() ?? '/';
  const { t } = useT();

  const food = t('nav.food.name');
  const finance = t('nav.finance.name');
  const future = t('nav.future.name');

  if (pathname === '/') return { kicker: t('brand.name'), title: t('nav.home') };
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
  if (pathname?.startsWith('/u/')) return { kicker: t('brand.name'), title: `@${decodeURIComponent(pathname.slice(3))}` };
  return { kicker: t('brand.name'), title: '' };
}

export default function Header() {
  const { user } = useAuth();
  const { t } = useT();
  const { theme, setTheme } = useTheme();
  const { kicker, title } = usePageMeta();
  const initial = (user?.firstName || user?.username || '?')[0].toUpperCase();

  return (
    <header style={{ width: '100%', maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, minHeight: 48 }}>
      {/* the logo lives in the sidebar on desktop; on phones it is here */}
      <Link
        href="/"
        className="header-brand"
        aria-label={t('brand.name')}
        style={{ width: 44, height: 44, flex: '0 0 44px', borderRadius: 14, background: 'var(--graphite)', color: 'var(--accent)', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 }}
      >
        {t('brand.name')[0]}
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{kicker}</div>
        <div style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="header-brand"
          onClick={() => setTheme(theme === 'light' ? 'ink' : 'light')}
          aria-label={theme === 'light' ? t('common.night') : t('common.day')}
          style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: 'var(--glass)', color: 'var(--ink)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
        </button>

        {user ? (
          <Link
            href="/profile"
            aria-label={t('nav.profile')}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flex: '0 0 auto' }}
          >
            {initial}
          </Link>
        ) : (
          <Link
            href="/login"
            style={{ fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 'var(--r-pill)', background: 'var(--graphite)', color: 'var(--graphite-ink)', flex: '0 0 auto' }}
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
