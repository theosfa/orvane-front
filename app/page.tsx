'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, Pill, Grid } from '@/components/ui';

export default function Home() {
  const { t } = useT();

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
      <section style={{ padding: 'clamp(28px, 5vw, 52px)', borderRadius: 'var(--r-lg)', background: 'var(--graphite)', color: 'var(--graphite-ink)', overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: -110, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'var(--accent)', opacity: 0.9 }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
          <div style={{ fontSize: 'clamp(30px, 4.6vw, 54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.04 }}>{t('landing.heroTitle')}</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--graphite-ink-2)', maxWidth: '56ch' }}>{t('landing.heroSub')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            <Link href="/register" style={{ fontSize: 14, fontWeight: 700, padding: '14px 24px', borderRadius: 'var(--r-pill)', background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {t('landing.ctaStart')}
            </Link>
            <a href="#food" style={{ fontSize: 14, fontWeight: 700, padding: '14px 24px', borderRadius: 'var(--r-pill)', border: '1px solid var(--graphite-line)', color: 'var(--graphite-ink)' }}>
              {t('landing.ctaHow')}
            </a>
          </div>
        </div>
      </section>

      <Grid min={260}>
        <Card id="food" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Pill accent>{t('landing.foodTag')}</Pill>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('landing.foodTitle')}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{t('landing.foodBody')}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-2)', borderTop: '1px solid var(--stroke-2)', paddingTop: 10 }}>{t('landing.foodNote')}</p>
        </Card>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Pill accent>{t('landing.financeTag')}</Pill>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('landing.financeTitle')}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{t('landing.financeBody')}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-2)', borderTop: '1px solid var(--stroke-2)', paddingTop: 10 }}>{t('landing.financeNote')}</p>
        </Card>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Pill accent>{t('landing.futureTag')}</Pill>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('landing.futureTitle')}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{t('landing.futureBody')}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-2)', borderTop: '1px solid var(--stroke-2)', paddingTop: 10 }}>{t('landing.futureNote')}</p>
        </Card>
      </Grid>

      <Card style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', maxWidth: 560 }}>{t('landing.closingTitle')}</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: 440 }}>{t('landing.closingSub')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 16 }}>
          <div style={{ border: '1px solid var(--stroke-2)', borderRadius: 'var(--r-md)', padding: '20px 24px', width: 220, textAlign: 'left', background: 'var(--glass-2)' }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{t('landing.freeTitle')}</div>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8 }}>{t('landing.freeBody')}</p>
          </div>
          <div style={{ border: '1px solid var(--stroke-2)', borderRadius: 'var(--r-md)', padding: '20px 24px', width: 220, textAlign: 'left', background: 'var(--glass-2)' }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {t('landing.proTitle')} <small style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('landing.proPer')}</small>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8 }}>{t('landing.proBody')}</p>
          </div>
        </div>
        <Link href="/register" style={{ marginTop: 8 }}>
          <Btn variant="primary">{t('landing.ctaStart')}</Btn>
        </Link>
      </Card>

      <footer style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 12, padding: '10px 0 40px' }}>{t('landing.footer')}</footer>
    </main>
  );
}
