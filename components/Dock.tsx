'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { AppId, APP_HOME, useAppMode } from '@/lib/app-mode-context';

type DockDef = { href: string; label: string; glyph: string };

function Tile({ active, glyph, tip, href, onClick, big }: { active: boolean; glyph: string; tip: string; href?: string; onClick?: () => void; big?: boolean }) {
  const inner = (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }} data-dock-item tabIndex={0}>
      <div
        data-tip
        style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          fontSize: 11, fontWeight: 700, padding: '6px 11px', borderRadius: 4, background: 'var(--glass-3)',
          WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', border: '1px solid var(--stroke-2)', boxShadow: 'var(--shadow)',
        }}
      >
        {tip}
      </div>
      <div
        style={{
          width: 50, height: 50, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: big ? 17 : 19, fontWeight: 800,
          background: active ? 'var(--accent)' : 'var(--glass-3)',
          color: active ? 'var(--accent-ink)' : 'var(--ink)',
          border: '1px solid var(--stroke-2)', boxShadow: 'var(--shadow)',
        }}
      >
        {glyph}
      </div>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? 'var(--accent)' : 'transparent' }} />
    </div>
  );
  if (href) {
    return (
      <Link href={href} style={{ color: 'inherit' }}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
      {inner}
    </button>
  );
}

export default function Dock() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useT();
  const { app, setApp } = useAppMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const dockByApp: Record<AppId, DockDef[]> = {
    food: [
      { href: '/recipes/feed', label: t('nav.food.feed'), glyph: '▶' },
      { href: '/recipes', label: t('nav.food.recipes'), glyph: '▤' },
      { href: '/menu', label: t('nav.food.menu'), glyph: '⊞' },
    ],
    future: [
      { href: '/future/plan', label: t('nav.future.plan'), glyph: '✓' },
      { href: '/future/goals', label: t('nav.future.goals'), glyph: '◆' },
    ],
    finance: [
      { href: '/finance/spending', label: t('nav.finance.spending'), glyph: '€' },
      { href: '/finance/wallets', label: t('nav.finance.wallets'), glyph: '◫' },
      { href: '/finance/categories', label: t('nav.finance.categories'), glyph: '#' },
    ],
  };

  const dock: DockDef[] = user
    ? [...dockByApp[app], { href: '/profile', label: t('nav.profile'), glyph: '◍' }]
    : [
        { href: '/', label: t('nav.home'), glyph: 'Л' },
        { href: '/login', label: t('nav.login'), glyph: '→' },
        { href: '/register', label: t('nav.register'), glyph: '+' },
      ];

  const apps: Array<{ id: AppId; name: string; tagline: string; mark: string }> = [
    { id: 'future', name: t('nav.future.name'), tagline: t('nav.future.tagline'), mark: t('nav.future.name')[0] },
    { id: 'food', name: t('nav.food.name'), tagline: t('nav.food.tagline'), mark: t('nav.food.name')[0] },
    { id: 'finance', name: t('nav.finance.name'), tagline: t('nav.finance.tagline'), mark: t('nav.finance.name')[0] },
  ];

  return (
    <nav
      style={{
        position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 40,
        display: 'flex', flexDirection: 'column', padding: '10px 12px', borderRadius: 10,
        background: 'var(--glass)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', backdropFilter: 'blur(30px) saturate(190%)',
        border: '1px solid var(--stroke)', boxShadow: 'var(--shadow-lg)', maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {user && (
        <div style={{ overflow: 'hidden', height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0, transition: 'opacity .2s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '2px 0 12px', minWidth: 230 }}>
            {apps.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setApp(a.id);
                  setMenuOpen(false);
                  router.push(APP_HOME[a.id]);
                }}
                style={{
                  width: '100%', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '11px 14px', borderRadius: 6, cursor: 'pointer',
                  background: app === a.id ? 'var(--accent-tint)' : 'var(--glass-2)',
                  border: `1px solid ${app === a.id ? 'var(--accent)' : 'var(--stroke-2)'}`,
                  color: 'var(--ink)',
                }}
              >
                <span style={{ flex: '0 0 34px', width: 34, height: 34, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, background: 'var(--accent)', color: 'var(--accent-ink)' }}>
                  {a.mark}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>{a.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{a.tagline}</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--stroke-2)', margin: '0 0 10px' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {user && (
          <>
            <Tile active={menuOpen} glyph="▦" tip={menuOpen ? t('common.close') : t('common.switchApp')} onClick={() => setMenuOpen((v) => !v)} big />
            <div style={{ width: 1, alignSelf: 'stretch', margin: '4px 4px 12px', background: 'var(--stroke-2)' }} />
          </>
        )}
        {dock.map((d) => (
          <Tile key={d.href} active={pathname === d.href} glyph={d.glyph} tip={d.label} href={d.href} />
        ))}
      </div>
    </nav>
  );
}
