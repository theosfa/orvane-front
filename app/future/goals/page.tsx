'use client';

import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { useFutureMock } from '@/lib/mock/future-context';
import { Card, Grid } from '@/components/ui';

function GoalsPageContent() {
  const { goals } = useFutureMock();

  return (
    <main style={{ paddingBottom: 40 }}>
      <Grid min={280}>
        {goals.map((g) => (
          <Card key={g.name} as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em' }}>{g.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em' }}>{g.now}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{g.pct}%</span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: 'var(--glass-2)', overflow: 'hidden' }}>
              <div style={{ width: `${g.pct}%`, height: '100%', borderRadius: 999, background: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{g.note}</div>
          </Card>
        ))}
      </Grid>
    </main>
  );
}

export default function FutureGoalsPage() {
  return (
    <RequireAuth>
      <GoalsPageContent />
    </RequireAuth>
  );
}
