'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { Card, Pill } from '@/components/ui';
import { Icon, IconName } from '@/components/icons';

type Feature = 'food' | 'finance' | 'future' | 'family' | 'social';
const FEATURES: Array<{ id: Feature; icon: IconName }> = [
  { id: 'food', icon: 'recipes' },
  { id: 'finance', icon: 'wallets' },
  { id: 'future', icon: 'plan' },
  { id: 'family', icon: 'profile' },
  { id: 'social', icon: 'liked' },
];
const FACTS = ['Free', 'Family', 'Lang'] as const;

export default function Home() {
  const { t } = useT();

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
      <section style={{ padding: 'clamp(28px, 5vw, 52px)', borderRadius: 'var(--r-lg)', background: 'var(--graphite)', color: 'var(--graphite-ink)', overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden="true" className="hero-blob" />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
          <h2 style={{ fontSize: 'clamp(30px, 4.6vw, 54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.04 }}>{t('landing.heroTitle')}</h2>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--graphite-ink-2)', maxWidth: '58ch' }}>{t('landing.heroSub')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            <Link href="/register" style={{ fontSize: 14, fontWeight: 700, padding: '14px 24px', borderRadius: 'var(--r-pill)', background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {t('landing.ctaStart')}
            </Link>
            <a href="#features" style={{ fontSize: 14, fontWeight: 700, padding: '14px 24px', borderRadius: 'var(--r-pill)', border: '1px solid var(--graphite-line)', color: 'var(--graphite-ink)' }}>
              {t('landing.ctaHow')}
            </a>
          </div>
        </div>
      </section>

      <div id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, scrollMarginTop: 16 }}>
        {FEATURES.map((f) => (
          <Card key={f.id} as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Pill accent>{t(`landing.${f.id}Tag`)}</Pill>
              <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--glass-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={18} />
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{t(`landing.${f.id}Title`)}</h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>{t(`landing.${f.id}Body`)}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', borderTop: '1px solid var(--stroke-2)', paddingTop: 10, marginTop: 'auto' }}>{t(`landing.${f.id}Note`)}</p>
          </Card>
        ))}
      </div>

      <section style={{ borderRadius: 'var(--r-lg)', padding: 'clamp(28px, 5vw, 48px)', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1, maxWidth: 680 }}>{t('landing.closingTitle')}</h2>
        <p style={{ fontSize: 15, fontWeight: 600, maxWidth: 540 }}>{t('landing.closingSub')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' }}>
          {FACTS.map((k) => (
            <div key={k} style={{ flex: '1 1 180px', maxWidth: 240, borderRadius: 'var(--r-md)', padding: '18px 20px', background: '#1b1d18', color: '#ffffff', textAlign: 'left' }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#c6f24e' }}>{t(`landing.fact${k}Value`)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#b9bcb2', marginTop: 8 }}>{t(`landing.fact${k}Label`)}</div>
            </div>
          ))}
        </div>
        <Link href="/register" style={{ fontSize: 14, fontWeight: 700, padding: '14px 26px', borderRadius: 'var(--r-pill)', background: '#1b1d18', color: '#ffffff' }}>
          {t('landing.ctaStart')}
        </Link>
      </section>

      <footer style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 12, padding: '10px 0 40px' }}>{t('landing.footer')}</footer>
    </main>
  );
}
