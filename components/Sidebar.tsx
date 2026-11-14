'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';
import { Icon, IconName } from '@/components/icons';

type Item = { href: string; label: string; icon: IconName };
type Group = { title?: string; items: Item[] };

// a recipe page (/recipes/123) belongs to "Recipes"; everything else matches exactly
export function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href === '/recipes' && /^\/recipes\/\d+/.test(pathname);
}

// Desktop navigation (≥960px): a graphite panel on the left with every section of every
// app at once. On phones it is hidden by CSS and the bottom Dock is used instead.
export default function Sidebar() {
  const pathname = usePathname() ?? '/';
  const { user } = useAuth();
  const { t } = useT();
  const { theme, setTheme } = useTheme();

  const groups: Group[] = user
    ? [
        { items: [{ href: '/dashboard', label: t('nav.dashboard'), icon: 'home' }] },
        {
          title: t('nav.food.name'),
          items: [
            { href: '/recipes/feed', label: t('nav.food.feed'), icon: 'feed' },
            { href: '/recipes', label: t('nav.food.recipes'), icon: 'recipes' },
            { href: '/menu', label: t('nav.food.menu'), icon: 'menu' },
            { href: '/ingredients', label: t('nav.food.ingredients'), icon: 'ingredients' },
            { href: '/recipes/liked', label: t('nav.food.liked'), icon: 'liked' },
          ],
        },
        {
          title: t('nav.future.name'),
          items: [
            { href: '/future/plan', label: t('nav.future.plan'), icon: 'plan' },
            { href: '/future/goals', label: t('nav.future.goals'), icon: 'goals' },
          ],
        },
        {
          title: t('nav.finance.name'),
          items: [
            { href: '/finance/spending', label: t('nav.finance.spending'), icon: 'spending' },
            { href: '/finance/wallets', label: t('nav.finance.wallets'), icon: 'wallets' },
            { href: '/finance/categories', label: t('nav.finance.categories'), icon: 'categories' },
          ],
        },
      ]
    : [
        {
          items: [
            { href: '/', label: t('nav.home'), icon: 'home' },
            { href: '/login', label: t('nav.login'), icon: 'login' },
            { href: '/register', label: t('nav.register'), icon: 'register' },
          ],
        },
      ];

  const name = user?.firstName || user?.username || '';
  const initial = (name || '?')[0].toUpperCase();
  const brand = t('brand.name');

  return (
    <aside className="app-sidebar" aria-label={brand}>
      <div
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 4,
          padding: '20px 12px 12px', borderRadius: 'var(--r-lg)', background: 'var(--graphite)', color: 'var(--graphite-ink)',
        }}
      >
        <Link href={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 14px', color: 'var(--graphite-ink)', textDecoration: 'none' }}>
          <span style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
            {brand[0]}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{brand}</span>
        </Link>

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {groups.map((g, gi) => (
            <div key={g.title ?? gi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.title && <div className="side-group-title">{g.title}</div>}
              {g.items.map((it) => {
                const active = isNavActive(pathname, it.href);
                return (
                  <Link key={it.href} href={it.href} className="side-link" data-active={active ? '1' : '0'} aria-current={active ? 'page' : undefined}>
                    <Icon name={it.icon} size={18} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--graphite-line)' }}>
          <div role="group" aria-label={`${t('common.day')} / ${t('common.night')}`} style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 'var(--r-pill)', background: 'var(--graphite-2)' }}>
            {(['light', 'ink'] as const).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setTheme(th)}
                aria-pressed={theme === th}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', border: 0, cursor: 'pointer',
                  borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700,
                  background: theme === th ? 'var(--graphite-ink)' : 'transparent',
                  color: theme === th ? 'var(--graphite)' : 'var(--graphite-ink-2)',
                }}
              >
                <Icon name={th === 'light' ? 'sun' : 'moon'} size={14} />
                {th === 'light' ? t('common.day') : t('common.night')}
              </button>
            ))}
          </div>

          {user && (
            <Link href="/profile" className="side-link" data-active={pathname === '/profile' ? '1' : '0'} style={{ padding: 8 }}>
              <span style={{ width: 36, height: 36, flex: '0 0 36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                ...(pathname === '/profile' ? { background: 'var(--graphite)', color: 'var(--graphite-ink)' } : { background: 'var(--accent)', color: 'var(--accent-ink)' }) }}>
                {initial}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{t('nav.profile')}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
