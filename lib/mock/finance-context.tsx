'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useT } from '@/lib/i18n/context';

type Expense = { id: string; day: string; who: string; cat: string; amt: number; link: string };
type Budget = { name: string; spent: number; cap: number };

type FinanceMockValue = {
  expenses: Expense[];
  budgets: Budget[];
  cats: string[];
  addExpense: (amt: number, who: string, cat: string) => void;
  spentTotal: number;
  monthlyCap: number;
};

const FinanceMockContext = createContext<FinanceMockValue | null>(null);

const MONTHLY_CAP = 450;

// Finance has no backend yet — this holds prototype state (seeded from the
// translation messages so it follows the language) for the session only.
export function FinanceMockProvider({ children }: { children: React.ReactNode }) {
  const { t, list } = useT();
  const seedExpenses = list<{ day: string; who: string; cat: string; amt: number; link: string }>('finance.expensesSeed');
  const budgets = list<Budget>('finance.budgetsSeed');
  const cats = list<string>('finance.cats');

  const [extra, setExtra] = useState<Expense[]>([]);

  const expenses = useMemo<Expense[]>(() => {
    const seeded = seedExpenses.map((e, i) => ({ id: `seed-${i}`, ...e }));
    return [...extra, ...seeded];
  }, [seedExpenses, extra]);

  const addExpense = useCallback(
    (amt: number, who: string, cat: string) => {
      if (!amt) return;
      setExtra((prev) => [{ id: `extra-${Date.now()}`, day: t('future.today'), who: who || '—', cat, amt, link: '' }, ...prev]);
    },
    [t],
  );

  const spentTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amt, 0), [expenses]);

  return (
    <FinanceMockContext.Provider value={{ expenses, budgets, cats, addExpense, spentTotal, monthlyCap: MONTHLY_CAP }}>
      {children}
    </FinanceMockContext.Provider>
  );
}

export function useFinanceMock() {
  const ctx = useContext(FinanceMockContext);
  if (!ctx) throw new Error('useFinanceMock must be used within FinanceMockProvider');
  return ctx;
}
