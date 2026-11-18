'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { AppId, APP_HOME, useAppMode } from '@/lib/app-mode-context';
import { Icon, IconName } from '@/components/icons';

export type NavItem = { href: string; label: string; icon: IconName };

// a recipe page (/recipes/123) belongs to "Recipes"; everything else matches exactly
export function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href === '/recipes' && /^\/recipes\/\d+/.test(pathname);
}

// The same navigation the dock has always had: the sections of the app you are in,
// an app switcher (Food / Plans / Finance) and the profile; guests get home/login/register.
export function useNavModel() {
  const { user } = useAuth();
  const { t } = useT();
  const { app } = useAppMode();

  const byApp: Record<AppId, NavItem[]> = {
    food: [
      { href: '/recipes/feed', label: t('nav.food.feed'), icon: 'feed' },
      { href: '/recipes', label: t('nav.food.recipes'), icon: 'recipes' },
      { href: '/menu', label: t('nav.food.menu'), icon: 'menu' },
    ],
    future: [
      { href: '/future/plan', label: t('nav.future.plan'), icon: 'plan' },
      { href: '/future/goals', label: t('nav.future.goals'), icon: 'goals' },
    ],
    finance: [
      { href: '/finance/spending', label: t('nav.finance.spending'), icon: 'spending' },
      { href: '/finance/wallets', label: t('nav.finance.wallets'), icon: 'wallets' },
      { href: '/finance/categories', label: t('nav.finance.categories'), icon: 'categories' },
    ],
  };

  const items: NavItem[] = user
    ? [...byApp[app], { href: '/profile', label: t('nav.profile'), icon: 'profile' }]
    : [
        { href: '/', label: t('nav.home'), icon: 'home' },
        { href: '/login', label: t('nav.login'), icon: 'login' },
        { href: '/register', label: t('nav.register'), icon: 'register' },
      ];

  const apps: Array<{ id: AppId; name: string; tagline: string; mark: string }> = [
    { id: 'future', name: t('nav.future.name'), tagline: t('nav.future.tagline'), mark: t('nav.future.name')[0] },
    { id: 'food', name: t('nav.food.name'), tagline: t('nav.food.tagline'), mark: t('nav.food.name')[0] },
    { id: 'finance', name: t('nav.finance.name'), tagline: t('nav.finance.tagline'), mark: t('nav.finance.name')[0] },
  ];

  return { user, items, apps, app };
}

// Desktop (≥960px): the dock's navigation as a graphite panel on the left.
// On phones it is hidden by CSS and the bottom Dock is used instead.
export default function Sidebar() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { t } = useT();
  const { setApp } = useAppMode();
  const { user, items, apps, app } = useNavModel();
  const brand = t('brand.name');

  return (
    <aside className="app-sidebar" aria-label={brand}>
      <div
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 4,
          padding: '20px 12px 12px', borderRadius: 'var(--r-lg)', background: 'var(--graphite)', color: 'var(--graphite-ink)',
        }}
      >
        <Link href={user ? APP_HOME[app] : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 14px', color: 'var(--graphite-ink)', textDecoration: 'none' }}>
          <span style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
            {brand[0]}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{brand}</span>
        </Link>

        {user && (
          <>
            <div className="side-group-title">{t('common.switchApp')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {apps.map((a) => {
                const on = app === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setApp(a.id);
                      router.push(APP_HOME[a.id]);
                    }}
                    style={{
                      width: '100%', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      padding: 8, borderRadius: 'var(--r-md)', cursor: 'pointer', border: 0,
                      background: on ? `var(--app-${a.id})` : 'var(--graphite-2)',
                      color: on ? '#1b1d18' : 'var(--graphite-ink)',
                    }}
                  >
                    <span
                      style={{
                        flex: '0 0 34px', width: 34, height: 34, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800,
                        background: on ? '#1b1d18' : `var(--app-${a.id})`, color: on ? `var(--app-${a.id})` : '#1b1d18',
                      }}
                    >
                      {a.mark}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>{a.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ height: 1, background: 'var(--graphite-line)', margin: '12px 4px 8px' }} />
          </>
        )}

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((it) => {
            const active = isNavActive(pathname, it.href);
            return (
              <Link key={it.href} href={it.href} className="side-link" data-active={active ? '1' : '0'} aria-current={active ? 'page' : undefined}>
                <Icon name={it.icon} size={18} />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
