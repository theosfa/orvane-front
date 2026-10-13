'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useT } from '@/lib/i18n/context';
import { financeApi, ApiError, Wallet } from '@/lib/api';
import { parseAmount } from '@/lib/finance';
import { Card, Btn, GlassInput, Grid, Kicker, ErrorMsg, StateMsg } from '@/components/ui';

function WalletCard({ wallet, onChanged, onDelete }: { wallet: Wallet; onChanged: () => void; onDelete: () => void }) {
  const { t, money } = useT();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(wallet.name);
  const [initial, setInitial] = useState(String(wallet.initialBalance));
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const initialBalance = parseAmount(initial, { allowNegative: true });
    if (!name.trim() || initialBalance === null) {
      setError(t('finance.walletInvalid'));
      return;
    }
    try {
      await financeApi.updateWallet(wallet.id, { name: name.trim(), initialBalance });
      setEditing(false);
      setError(null);
      onChanged();
    } catch {
      setError(t('finance.saveError'));
    }
  };

  const zero = wallet.balance === 0;

  return (
    <Card as="article" data-testid="wallet-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {editing ? (
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <GlassInput aria-label={t('finance.walletName')} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
            {t('finance.initialBalance')}
            <GlassInput value={initial} onChange={(e) => setInitial(e.target.value)} inputMode="decimal" />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" type="submit">
              {t('common.save')}
            </Btn>
            <Btn
              onClick={() => {
                setEditing(false);
                setName(wallet.name);
                setInitial(String(wallet.initialBalance));
                setError(null);
              }}
            >
              {t('common.cancel')}
            </Btn>
          </div>
        </form>
      ) : (
        <>
          <Kicker>{wallet.name}</Kicker>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: wallet.balance < 0 ? '#c0432a' : 'inherit' }}>{money(wallet.balance)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            {t('finance.initialBalance')}: {money(wallet.initialBalance)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Btn onClick={() => setEditing(true)}>{t('finance.edit')}</Btn>
            <Btn onClick={onDelete} disabled={!zero}>
              {t('common.remove')}
            </Btn>
          </div>
          {!zero && <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('finance.walletNotZero')}</div>}
        </>
      )}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Card>
  );
}

function WalletsPageContent() {
  const { t, lang, money } = useT();
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Wallet | null>(null);

  const load = useCallback(() => financeApi.wallets().then(setWallets), []);

  useEffect(() => {
    load().catch(() => setError(t('finance.loadError')));
  }, [load, lang, t]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const initialBalance = initial.trim() ? parseAmount(initial, { allowNegative: true }) : 0;
    if (!name.trim() || initialBalance === null) {
      setFormError(t('finance.walletInvalid'));
      return;
    }
    setFormError(null);
    try {
      await financeApi.createWallet({ name: name.trim(), initialBalance });
      setName('');
      setInitial('');
      await load();
    } catch {
      setFormError(t('finance.saveError'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    try {
      await financeApi.deleteWallet(id);
    } catch (err) {
      setFormError(err instanceof ApiError && err.status === 409 ? t('finance.walletNotZero') : t('finance.saveError'));
    }
    load().catch(() => setError(t('finance.loadError')));
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!wallets) return <StateMsg>{t('common.loading')}</StateMsg>;

  const total = Math.round(wallets.reduce((sum, w) => sum + w.balance, 0) * 100) / 100;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{t('finance.walletsTitle')}</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('finance.walletsSub')}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {t('finance.totalBalance')}: <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{money(total)}</strong>
          </div>
        </div>
        <form onSubmit={create} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <GlassInput aria-label={t('finance.walletName')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('finance.walletNamePh')} maxLength={60} style={{ flex: '1 1 200px' }} />
          <GlassInput
            aria-label={t('finance.initialBalance')}
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            placeholder={t('finance.initialBalancePh')}
            inputMode="decimal"
            style={{ flex: '0 1 180px' }}
          />
          <Btn variant="primary" type="submit" disabled={!name.trim()}>
            {t('finance.addWallet')}
          </Btn>
        </form>
        {formError && <ErrorMsg>{formError}</ErrorMsg>}
      </Card>

      <Grid min={240}>
        {wallets.map((w) => (
          <WalletCard key={`${w.id}-${w.name}-${w.initialBalance}-${w.balance}`} wallet={w} onChanged={() => load()} onDelete={() => setToDelete(w)} />
        ))}
      </Grid>

      <ConfirmDialog
        open={!!toDelete}
        title={t('finance.confirmDeleteWallet', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {t('finance.deleteWalletHint')}
      </ConfirmDialog>
    </main>
  );
}

export default function WalletsPage() {
  return (
    <RequireAuth>
      <WalletsPageContent />
    </RequireAuth>
  );
}
