'use client';

import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { useFinanceMock } from '@/lib/mock/finance-context';
import { Card, Btn, Grid } from '@/components/ui';

function BudgetsPageContent() {
  const { t, money } = useT();
  const { budgets } = useFinanceMock();

  const overspent = budgets.find((b) => b.spent / b.cap >= 1);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Grid min={280}>
        {budgets.map((b) => {
          const pct = Math.min(100, Math.round((b.spent / b.cap) * 100));
          return (
            <Card key={b.name} as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{b.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>{money(b.spent, 0)}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('finance.ofCap')} {money(b.cap, 0)}</span>
              </div>
              <div style={{ height: 9, borderRadius: 999, background: 'var(--glass-2)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pct >= 100 ? '#c0432a' : 'var(--accent)' }} />
              </div>
            </Card>
          );
        })}
      </Grid>

      {overspent && (
        <Card as="section" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, maxWidth: '56ch' }}>{t('finance.nudge')}</div>
          <Btn variant="primary">{t('finance.move')} {money(15, 0)}</Btn>
        </Card>
      )}
    </main>
  );
}

export default function BudgetsPage() {
  return (
    <RequireAuth>
      <BudgetsPageContent />
    </RequireAuth>
  );
}
