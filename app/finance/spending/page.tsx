'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useT } from '@/lib/i18n/context';
import {
  financeApi,
  ApiError,
  FinanceCategory,
  FinanceSummary,
  FinanceTransaction,
  TransactionFilters,
  TransactionType,
  Wallet,
} from '@/lib/api';
import { today, parseISODate } from '@/lib/dates';
import { PERIOD_PRESETS, PeriodPreset, parseAmount, periodRange } from '@/lib/finance';
import { SettlePreset, parseSettle, settleCategory } from '@/lib/settle';
import { Card, Btn, Chip, GlassInput, GlassSelect, Grid, Pill, Kicker, ErrorMsg, StateMsg, EmptyState } from '@/components/ui';

const TYPES: TransactionType[] = ['expense', 'income'];

// settle: closing a Plans task — an expense prefilled from it, dated today; only the amount is left
function EntryForm({
  wallets,
  categories,
  settle,
  onSaved,
  onCancelSettle,
}: {
  wallets: Wallet[];
  categories: FinanceCategory[];
  settle: SettlePreset | null;
  onSaved: (settledTask: boolean) => void;
  onCancelSettle: () => void;
}) {
  const { t } = useT();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(settle?.title ?? '');
  const [date, setDate] = useState(today());
  const [walletId, setWalletId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | null>(settle ? settleCategory(settle, categories) : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeCats = categories.filter((c) => c.type === type);
  const wallet = walletId === '' ? wallets[0]?.id : walletId;

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategoryId(null); // categories belong to one type
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    if (value === null) {
      setError(t('finance.amountInvalid'));
      return;
    }
    if (!wallet) return;
    setError(null);
    setSaving(true);
    try {
      await financeApi.createTransaction({ type, amount: value, note, date, walletId: wallet, categoryId, ...(settle && { taskId: settle.taskId }) });
      setAmount('');
      setNote('');
      onSaved(!!settle);
    } catch {
      setError(t('finance.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (wallets.length === 0) {
    return (
      <Card as="section" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span>{t('finance.noWallets')}</span>
        <Link href="/finance/wallets">
          <Btn variant="primary">{t('finance.walletsTitle')}</Btn>
        </Link>
      </Card>
    );
  }

  return (
    <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 14, ...(settle && { border: '1.5px solid var(--accent)' }) }}>
      {settle && (
        <div data-testid="settle-banner" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 14, background: 'var(--accent-tint)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t('finance.settleBanner', { title: settle.title })}</span>
          <Btn onClick={onCancelSettle} style={{ padding: '7px 12px' }}>
            {t('finance.settleCancel')}
          </Btn>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Kicker>{t('finance.kicker')}</Kicker>
        <div style={{ display: 'flex', gap: 6 }} role="radiogroup" aria-label={t('finance.typeLabel')}>
          {TYPES.map((ty) => (
            <Chip key={ty} active={type === ty} onClick={() => switchType(ty)} role="radio" aria-checked={type === ty}>
              {t(`finance.${ty}`)}
            </Chip>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <GlassInput
          aria-label={t('finance.amount')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('finance.amountPh')}
          inputMode="decimal"
          autoFocus={!!settle}
          style={{ flex: '0 1 140px', fontSize: 19, fontWeight: 800 }}
        />
        <GlassInput aria-label={t('finance.note')} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('finance.notePh')} maxLength={200} style={{ flex: '1 1 200px' }} />
        <GlassInput aria-label={t('finance.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ flex: '0 1 160px' }} />
        <GlassSelect aria-label={t('finance.wallet')} value={wallet} onChange={(e) => setWalletId(Number(e.target.value))} style={{ flex: '0 1 160px' }}>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </GlassSelect>
        <Btn variant="primary" type="submit" disabled={saving || !amount} style={{ padding: '13px 24px' }}>
          {saving ? t('finance.saving') : type === 'income' ? t('finance.addIncome') : t('finance.addExpense')}
        </Btn>
      </form>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>
          {t('finance.noCategory')}
        </Chip>
        {typeCats.map((c) => (
          <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
            {c.name}
          </Chip>
        ))}
        <Link href="/finance/categories" style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)', marginLeft: 4 }}>
          {t('finance.manageCategories')}
        </Link>
      </div>
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Card>
  );
}

function SpendingPageContent() {
  const { t, lang, money, format } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  // /finance/spending?task=… — came from Plans to settle a task
  const settle = useMemo(() => parseSettle(new URLSearchParams(searchParams?.toString() ?? '')), [searchParams]);
  const [settledNote, setSettledNote] = useState(false);
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[] | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [preset, setPreset] = useState<PeriodPreset>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(''); // '' | 'none' | id
  const [walletFilter, setWalletFilter] = useState<string>('');

  const [toDelete, setToDelete] = useState<FinanceTransaction | null>(null);

  const filters = useMemo<TransactionFilters>(() => {
    const range = periodRange(preset, today(), { from: customFrom, to: customTo });
    return {
      ...range,
      type: typeFilter || undefined,
      walletId: walletFilter ? Number(walletFilter) : undefined,
      categoryId: categoryFilter === 'none' ? 'none' : categoryFilter ? Number(categoryFilter) : undefined,
    };
  }, [preset, customFrom, customTo, typeFilter, walletFilter, categoryFilter]);

  const loadRefs = useCallback(async () => {
    const [w, c] = await Promise.all([financeApi.wallets(), financeApi.categories()]);
    setWallets(w);
    setCategories(c);
  }, []);

  const loadOperations = useCallback(async () => {
    const [list, sum] = await Promise.all([financeApi.transactions(filters), financeApi.summary(filters)]);
    setTransactions(list);
    setSummary(sum);
  }, [filters]);

  // the first call also creates default categories in the current language
  useEffect(() => {
    loadRefs().catch(() => setError(t('finance.loadError')));
  }, [loadRefs, lang, t]);

  useEffect(() => {
    if (!wallets) return; // wait for the defaults to exist
    loadOperations().catch(() => setError(t('finance.loadError')));
  }, [wallets, loadOperations, t]);

  const refreshAll = () => {
    loadRefs().catch(() => setError(t('finance.loadError')));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    try {
      await financeApi.deleteTransaction(id);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) setError(t('finance.saveError'));
    }
    refreshAll();
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!wallets) return <StateMsg>{t('common.loading')}</StateMsg>;

  const filterCats = categories.filter((c) => !typeFilter || c.type === typeFilter);
  const filtered = !!(typeFilter || categoryFilter || walletFilter);
  const shortDate = (iso: string) => format.dateTime(parseISODate(iso), { day: 'numeric', month: 'short' });

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {settledNote && (
        <Card role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 18px' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{t('finance.settled')}</span>
          <Link href="/future/plan" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>
            {t('finance.backToPlans')}
          </Link>
        </Card>
      )}
      <EntryForm
        key={settle?.taskId ?? 'new'}
        wallets={wallets}
        categories={categories}
        settle={settle}
        onSaved={(settledTask) => {
          refreshAll();
          if (settledTask) {
            setSettledNote(true);
            router.replace('/finance/spending');
          }
        }}
        onCancelSettle={() => router.replace('/finance/spending')}
      />

      <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Kicker>{t('finance.filters')}</Kicker>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PERIOD_PRESETS.map((p) => (
            <Chip key={p} active={preset === p} onClick={() => setPreset(p)}>
              {t(`finance.period.${p}`)}
            </Chip>
          ))}
        </div>
        {preset === 'custom' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <GlassInput aria-label={t('finance.from')} type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ width: 170 }} />
            <span style={{ color: 'var(--ink-2)' }}>—</span>
            <GlassInput aria-label={t('finance.to')} type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ width: 170 }} />
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <GlassSelect
            aria-label={t('finance.typeLabel')}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TransactionType | '');
              setCategoryFilter('');
            }}
          >
            <option value="">{t('finance.allTypes')}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`finance.${ty}`)}
              </option>
            ))}
          </GlassSelect>
          <GlassSelect aria-label={t('finance.category')} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{t('finance.allCategories')}</option>
            <option value="none">{t('finance.noCategory')}</option>
            {filterCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </GlassSelect>
          <GlassSelect aria-label={t('finance.wallet')} value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
            <option value="">{t('finance.allWallets')}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </GlassSelect>
          {filtered && (
            <Btn
              onClick={() => {
                setTypeFilter('');
                setCategoryFilter('');
                setWalletFilter('');
              }}
            >
              {t('finance.resetFilters')}
            </Btn>
          )}
        </div>
      </Card>

      {summary && (
        <Grid min={200}>
          <Card>
            <Kicker>{t('finance.incomeTotal')}</Kicker>
            <div data-testid="sum-income" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent-deep)' }}>
              {money(summary.income)}
            </div>
          </Card>
          <Card>
            <Kicker>{t('finance.expenseTotal')}</Kicker>
            <div data-testid="sum-expense" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>
              {money(summary.expense)}
            </div>
          </Card>
          <Card>
            <Kicker>{t('finance.net')}</Kicker>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: summary.net < 0 ? '#c0432a' : 'inherit' }}>{money(summary.net)}</div>
          </Card>
        </Grid>
      )}

      {summary && summary.byCategory.length > 0 && (
        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('finance.byCategory')}</h2>
          {summary.byCategory.map((c) => {
            const total = c.type === 'income' ? summary.income : summary.expense;
            const pct = total ? Math.round((c.total / total) * 100) : 0;
            return (
              <div key={`${c.type}-${c.categoryId}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                  <span>
                    <strong>{c.name ?? t('finance.noCategory')}</strong>{' '}
                    <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>
                      {t(`finance.${c.type}`)} · {t('finance.count', { count: c.count })}
                    </span>
                  </span>
                  <strong>{money(c.total)}</strong>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: 'var(--glass-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: c.type === 'income' ? 'var(--accent)' : 'var(--ink-2)' }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Card as="section" style={{ padding: '14px 16px 18px' }}>
        <h2 style={{ margin: '8px 10px 12px', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{t('finance.operations')}</h2>
        {transactions === null && <StateMsg>{t('common.loading')}</StateMsg>}
        {transactions?.length === 0 && (
          <EmptyState title={t('finance.emptyTitle')}>{filtered || preset !== 'all' ? t('finance.noMatches') : t('finance.emptyBody')}</EmptyState>
        )}
        {transactions?.map((tx) => (
          <div
            key={tx.id}
            data-testid="tx-row"
            style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) auto auto', gap: 12, alignItems: 'center', padding: '13px 10px', borderTop: '1px solid var(--stroke-2)' }}
          >
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{shortDate(tx.date)}</span>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.note || tx.categoryName || t('finance.noCategory')}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Pill>{tx.categoryName ?? t('finance.noCategory')}</Pill>
                <Pill>{tx.walletName}</Pill>
              </span>
            </div>
            <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: tx.type === 'income' ? 'var(--accent-deep)' : 'inherit' }}>
              {tx.type === 'income' ? '+' : '−'}
              {money(tx.amount)}
            </span>
            <button
              type="button"
              aria-label={t('common.remove')}
              onClick={() => setToDelete(tx)}
              style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title={t('finance.confirmDeleteTx')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && `${toDelete.note || toDelete.categoryName || ''} ${money(toDelete.amount)}`}
      </ConfirmDialog>
    </main>
  );
}

export default function SpendingPage() {
  return (
    <RequireAuth>
      {/* useSearchParams needs a Suspense boundary */}
      <Suspense>
        <SpendingPageContent />
      </Suspense>
    </RequireAuth>
  );
}
