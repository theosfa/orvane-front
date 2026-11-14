'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/context';
import { APP_HOME, useAppMode } from '@/lib/app-mode-context';
import { Icon, IconName } from '@/components/icons';
import { isNavActive, useNavModel } from '@/components/Sidebar';

function Tile({ active, icon, tip, href, onClick }: { active: boolean; icon: IconName; tip: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} data-dock-item>
      <div
        data-tip
        style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 'var(--r-pill)',
          background: 'var(--glass)', color: 'var(--ink)', boxShadow: 'var(--shadow-lg)',
        }}
      >
        {tip}
      </div>
      <div
        style={{
          width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? 'var(--accent-ink)' : 'var(--graphite-ink-2)',
        }}
      >
        <Icon name={icon} size={20} />
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} aria-label={tip} aria-current={active ? 'page' : undefined} style={{ color: 'inherit' }}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={tip} aria-expanded={active} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
      {inner}
    </button>
  );
}

// Phone navigation, unchanged in behaviour: the app switcher, the current app's sections
// and the profile, at the bottom of the screen. Hidden on desktop, where the Sidebar
// shows the same navigation.
export default function Dock() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { t } = useT();
  const { setApp } = useAppMode();
  const { user, items, apps, app } = useNavModel();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="mobile-dock"
      aria-label={t('common.switchApp')}
      style={{
        position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 40,
        flexDirection: 'column', padding: 8, borderRadius: 28,
        background: 'var(--graphite)', color: 'var(--graphite-ink)', boxShadow: 'var(--shadow-lg)', maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {user && menuOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 4px 10px', minWidth: 240 }}>
          {apps.map((a) => {
            const on = app === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setApp(a.id);
                  setMenuOpen(false);
                  router.push(APP_HOME[a.id]);
                }}
                style={{
                  width: '100%', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  padding: 10, borderRadius: 'var(--r-md)', cursor: 'pointer', border: 0,
                  background: on ? `var(--app-${a.id})` : 'var(--graphite-2)',
                  color: on ? '#1b1d18' : 'var(--graphite-ink)',
                }}
              >
                <span
                  style={{
                    flex: '0 0 40px', width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
                    background: on ? '#1b1d18' : `var(--app-${a.id})`, color: on ? `var(--app-${a.id})` : '#1b1d18',
                  }}
                >
                  {a.mark}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>{a.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, whiteSpace: 'nowrap' }}>{a.tagline}</span>
                </span>
              </button>
            );
          })}
          <div style={{ height: 1, background: 'var(--graphite-line)', margin: '4px 0 0' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {user && (
          <>
            <Tile active={menuOpen} icon="apps" tip={menuOpen ? t('common.close') : t('common.switchApp')} onClick={() => setMenuOpen((v) => !v)} />
            <div style={{ width: 1, height: 28, margin: '0 4px', background: 'var(--graphite-line)' }} />
          </>
        )}
        {items.map((d) => (
          <Tile key={d.href} active={isNavActive(pathname, d.href)} icon={d.icon} tip={d.label} href={d.href} />
        ))}
      </div>
    </nav>
  );
}
