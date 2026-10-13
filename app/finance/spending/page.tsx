'use client';

import { useState, FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { useFinanceMock } from '@/lib/mock/finance-context';
import { Card, Btn, Chip, GlassInput, Grid, Pill } from '@/components/ui';

function SpendingPageContent() {
  const { t, money } = useT();
  const { expenses, budgets, cats, addExpense, spentTotal, monthlyCap } = useFinanceMock();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [cat, setCat] = useState(cats[0]);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const value = parseFloat(String(amount).replace(',', '.'));
    if (!value) return;
    addExpense(value, note, cat);
    setAmount('');
    setNote('');
  };

  const stillYours = monthlyCap - spentTotal;
  const dayOfMonth = new Date().getDate();
  const avgPerDay = spentTotal / Math.max(1, dayOfMonth);
  const biggest = budgets.reduce((max, b) => (b.spent > max.spent ? b : max), budgets[0]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.spendKicker')}</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <GlassInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('finance.amountPh')} style={{ flex: '0 1 140px', fontSize: 19, fontWeight: 800 }} />
          <GlassInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('finance.wherePh')} style={{ flex: '1 1 220px' }} />
          <Btn variant="primary" type="submit" style={{ padding: '13px 24px' }}>{t('finance.logIt')}</Btn>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
      </Card>

      <Grid min={200}>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.spentMonth')}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>{money(spentTotal)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.stillYours')}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent)' }}>{money(stillYours)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.avgDay')}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>{money(avgPerDay)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('finance.biggest')}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>{biggest?.name ?? '—'}</div>
        </Card>
      </Grid>

      <Card as="section" style={{ padding: '14px 16px 18px' }}>
        <h2 style={{ margin: '8px 10px 12px', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('finance.recent')}</h2>
        {expenses.map((e) => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr) 120px 92px', gap: 12, alignItems: 'center', padding: '13px 10px', borderTop: '1px solid var(--stroke-2)' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{e.day}</span>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{e.who}</span>
              {e.link && <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{e.link}</span>}
            </div>
            <Pill style={{ justifySelf: 'start' }}>{e.cat}</Pill>
            <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>{money(e.amt)}</span>
          </div>
        ))}
      </Card>
    </main>
  );
}

export default function SpendingPage() {
  return (
    <RequireAuth>
      <SpendingPageContent />
    </RequireAuth>
  );
}
