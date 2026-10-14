'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { familyApi, FamilyOverview, Scope, subscribeFamilyEvents } from './api';
import { useAuth } from './auth-context';
import { deriveScope } from './family-scope';
import { announceFamilyChange } from './family-live';

type FamilyContextValue = {
  overview: FamilyOverview | null; // null until loaded (or logged out)
  // whose data Finance, Menu and Plans show; always 'personal' outside a family
  scope: Scope;
  setScope: (scope: Scope) => void;
  // the shown data may be changed: own data always, family data by admins only
  canEdit: boolean;
  // after changes on the profile page, or to pick up an accepted invite
  apply: (next: FamilyOverview) => void;
  refresh: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

const STORAGE_KEY = 'nn_scope';

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [overview, setOverview] = useState<FamilyOverview | null>(null);
  const [chosen, setChosen] = useState<Scope>('personal');

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'family') setChosen('family');
    } catch {
      // storage blocked — stay personal
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setOverview(await familyApi.overview());
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else setOverview(null);
  }, [user, refresh]);

  // live updates: changes made by other family members (or on another device) show up
  // without a reload. The family itself is reloaded here; pages reload their own data.
  useEffect(() => {
    if (!user) return;
    const ctrl = new AbortController();
    subscribeFamilyEvents((topic) => (topic === 'family' ? refresh() : announceFamilyChange(topic)), {
      signal: ctrl.signal,
      onReconnect: () => {
        refresh();
        (['menu', 'tasks', 'finance'] as const).forEach(announceFamilyChange);
      },
    });
    return () => ctrl.abort();
  }, [user, refresh]);

  const setScope = useCallback((next: Scope) => {
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not remembered, fine
    }
  }, []);

  const { scope, canEdit } = deriveScope(overview, chosen);

  const value = useMemo(
    () => ({ overview, scope, setScope, canEdit, apply: setOverview, refresh }),
    [overview, scope, setScope, canEdit, refresh],
  );
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
