'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useT } from '@/lib/i18n/context';
import { useFamily } from '@/lib/family-context';
import { financeApi, Wallet } from '@/lib/api';
import { parseAmount } from '@/lib/finance';
import { today } from '@/lib/dates';
import { Btn, Card, ErrorMsg, GlassInput, GlassSelect, Kicker } from './ui';

// Move money between wallets the user may change — their own and, for family admins,
// the family budget's. It's neither spending nor income in the summaries.
export default function TransferCard({ reloadKey, onDone }: { reloadKey: unknown; onDone: () => void }) {
  const { t } = useT();
  const { overview } = useFamily();
  const familyAdmin = overview?.family?.myRole === 'admin';
  const [personal, setPersonal] = useState<Wallet[]>([]);
  const [family, setFamily] = useState<Wallet[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    financeApi.wallets().then(setPersonal).catch(() => setPersonal([]));
    if (familyAdmin) financeApi.wallets('family').then(setFamily).catch(() => setFamily([]));
    else setFamily([]);
  }, [familyAdmin, reloadKey]);

  const all = [...personal, ...family];
  if (all.length < 2) return null;

  // default: from the first personal wallet to the family budget (or the next wallet)
  const fromId = from || String(personal[0]?.id ?? all[0].id);
  const toId = to || String((family[0] ?? all.find((w) => String(w.id) !== fromId))!.id);

  const options = (
    <>
      <optgroup label={t('family.scopeMine')}>
        {personal.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </optgroup>
      {family.length > 0 && (
        <optgroup label={t('family.familyBudget')}>
          {family.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    if (value === null) {
      setError(t('finance.amountInvalid'));
      return;
    }
    if (fromId === toId) {
      setError(t('family.transferSame'));
      return;
    }
    setError(null);
    try {
      await financeApi.transfer({ fromWalletId: Number(fromId), toWalletId: Number(toId), amount: value, date: today() });
      setAmount('');
      setDone(true);
      onDone();
    } catch {
      setError(t('finance.saveError'));
    }
  };

  return (
    <Card as="section" data-testid="transfer-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kicker>{t('family.transferTitle')}</Kicker>
      <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <GlassSelect aria-label={t('family.transferFrom')} value={fromId} onChange={(e) => setFrom(e.target.value)} style={{ flex: '1 1 160px' }}>
          {options}
        </GlassSelect>
        <span aria-hidden style={{ color: 'var(--ink-2)', fontWeight: 800 }}>
          →
        </span>
        <GlassSelect aria-label={t('family.transferTo')} value={toId} onChange={(e) => setTo(e.target.value)} style={{ flex: '1 1 160px' }}>
          {options}
        </GlassSelect>
        <GlassInput
          aria-label={t('finance.amount')}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setDone(false);
          }}
          placeholder={t('finance.amountPh')}
          inputMode="decimal"
          style={{ flex: '0 1 130px' }}
        />
        <Btn variant="primary" type="submit" disabled={!amount}>
          {t('family.transferBtn')}
        </Btn>
      </form>
      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('family.transferHint')}</div>
      {done && (
        <div role="status" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>
          {t('family.transferDone')}
        </div>
      )}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Card>
  );
}
