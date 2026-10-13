'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useT } from '@/lib/i18n/context';

type TaskWhen = 'today' | 'week' | 'later';
type Task = { id: string; when: TaskWhen; text: string; link: string; done: boolean };
type Goal = { name: string; now: string; pct: number; note: string };

type FutureMockValue = {
  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (text: string) => void;
  goals: Goal[];
};

const FutureMockContext = createContext<FutureMockValue | null>(null);

// Future has no backend yet — this holds prototype state (seeded from the
// translation messages so it follows the language) for the session only.
export function FutureMockProvider({ children }: { children: React.ReactNode }) {
  const { list } = useT();
  const seed = list<{ when: TaskWhen; text: string; link: string; done: boolean }>('future.tasksSeed');
  const goals = list<Goal>('future.goalsSeed');

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [extra, setExtra] = useState<Task[]>([]);

  const tasks = useMemo<Task[]>(() => {
    const seeded = seed.map((s, i) => ({
      id: `seed-${i}`,
      when: s.when,
      text: s.text,
      link: s.link,
      done: overrides[`seed-${i}`] ?? s.done,
    }));
    return [...seeded, ...extra];
  }, [seed, overrides, extra]);

  const toggleTask = useCallback(
    (id: string) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;
      if (id.startsWith('seed-')) {
        setOverrides((prev) => ({ ...prev, [id]: !current.done }));
      } else {
        setExtra((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      }
    },
    [tasks],
  );

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setExtra((prev) => [...prev, { id: `extra-${Date.now()}`, when: 'today', text: trimmed, link: '', done: false }]);
  }, []);

  return <FutureMockContext.Provider value={{ tasks, toggleTask, addTask, goals }}>{children}</FutureMockContext.Provider>;
}

export function useFutureMock() {
  const ctx = useContext(FutureMockContext);
  if (!ctx) throw new Error('useFutureMock must be used within FutureMockProvider');
  return ctx;
}
