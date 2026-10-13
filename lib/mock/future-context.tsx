'use client';

import { createContext, useContext } from 'react';
import { useT } from '@/lib/i18n/context';

type Goal = { name: string; now: string; pct: number; note: string };

type FutureMockValue = {
  goals: Goal[];
};

const FutureMockContext = createContext<FutureMockValue | null>(null);

// Goals have no backend yet — prototype data seeded from the translation messages
// so it follows the language. (Tasks are real now: see tasksApi.)
export function FutureMockProvider({ children }: { children: React.ReactNode }) {
  const { list } = useT();
  const goals = list<Goal>('future.goalsSeed');
  return <FutureMockContext.Provider value={{ goals }}>{children}</FutureMockContext.Provider>;
}

export function useFutureMock() {
  const ctx = useContext(FutureMockContext);
  if (!ctx) throw new Error('useFutureMock must be used within FutureMockProvider');
  return ctx;
}
