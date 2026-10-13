'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useT } from '@/lib/i18n/context';
import { financeApi, ApiError, FinanceCategory, TransactionType } from '@/lib/api';
import { Card, Btn, GlassInput, Grid, ErrorMsg, StateMsg } from '@/components/ui';

function CategoryRow({ category, onRenamed, onDelete }: { category: FinanceCategory; onRenamed: () => void; onDelete: () => void }) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await financeApi.renameCategory(category.id, name.trim());
      setEditing(false);
      setError(null);
      onRenamed();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('finance.duplicateName') : t('finance.saveError'));
    }
  };

  return (
    <div data-testid="category-row" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0', borderTop: '1px solid var(--stroke-2)' }}>
      {editing ? (
        <form onSubmit={save} style={{ display: 'flex', gap: 8 }}>
          <GlassInput aria-label={t('finance.rename')} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
          <Btn variant="primary" type="submit">
            {t('common.save')}
          </Btn>
          <Btn
            onClick={() => {
              setEditing(false);
              setName(category.name);
              setError(null);
            }}
          >
            {t('common.cancel')}
          </Btn>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontWeight: 700 }}>{category.name}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={() => setEditing(true)} style={{ padding: '8px 14px' }}>
              {t('finance.rename')}
            </Btn>
            <Btn onClick={onDelete} aria-label={`${t('common.remove')} ${category.name}`} style={{ padding: '8px 14px' }}>
              ×
            </Btn>
          </div>
        </div>
      )}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </div>
  );
}

function CategoryColumn({
  type,
  categories,
  reload,
  onDelete,
}: {
  type: TransactionType;
  categories: FinanceCategory[];
  reload: () => void;
  onDelete: (c: FinanceCategory) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await financeApi.createCategory({ name: name.trim(), type });
      setName('');
      setError(null);
      reload();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('finance.duplicateName') : t('finance.saveError'));
    }
  };

  return (
    <Card as="section" data-testid={`column-${type}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{type === 'expense' ? t('finance.expenseCats') : t('finance.incomeCats')}</h2>
      <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
        <GlassInput aria-label={type === 'expense' ? t('finance.newExpenseCat') : t('finance.newIncomeCat')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('finance.newCategoryPh')} maxLength={60} />
        <Btn variant="primary" type="submit" disabled={!name.trim()}>
          {t('finance.addCategory')}
        </Btn>
      </form>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      {categories.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-2)', padding: '8px 0' }}>{t('finance.noCategories')}</div>}
      {categories.map((c) => (
        <CategoryRow key={`${c.id}-${c.name}`} category={c} onRenamed={reload} onDelete={() => onDelete(c)} />
      ))}
    </Card>
  );
}

function CategoriesPageContent() {
  const { t, lang } = useT();
  const [categories, setCategories] = useState<FinanceCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<FinanceCategory | null>(null);

  const load = useCallback(() => {
    financeApi
      .categories()
      .then(setCategories)
      .catch(() => setError(t('finance.loadError')));
  }, [t]);

  useEffect(load, [load, lang]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    try {
      await financeApi.deleteCategory(id);
    } catch {
      setError(t('finance.saveError'));
    }
    load();
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!categories) return <StateMsg>{t('common.loading')}</StateMsg>;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{t('finance.categoriesTitle')}</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('finance.categoriesSub')}</div>
      </div>
      <Grid min={300} style={{ alignItems: 'start' }}>
        {(['expense', 'income'] as const).map((type) => (
          <CategoryColumn key={type} type={type} categories={categories.filter((c) => c.type === type)} reload={load} onDelete={setToDelete} />
        ))}
      </Grid>

      <ConfirmDialog
        open={!!toDelete}
        title={t('finance.confirmDeleteCategory', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {t('finance.deleteCategoryHint')}
      </ConfirmDialog>
    </main>
  );
}

export default function CategoriesPage() {
  return (
    <RequireAuth>
      <CategoriesPageContent />
    </RequireAuth>
  );
}
