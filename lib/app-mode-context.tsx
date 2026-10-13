'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export type AppId = 'food' | 'finance' | 'future';

export const APP_HOME: Record<AppId, string> = {
  food: '/recipes',
  finance: '/finance/spending',
  future: '/future/plan',
};

const ROUTE_APP: Array<[RegExp, AppId]> = [
  [/^\/recipes/, 'food'],
  [/^\/ingredients/, 'food'],
  [/^\/menu/, 'food'],
  [/^\/finance/, 'finance'],
  [/^\/future/, 'future'],
];

type AppModeContextValue = {
  app: AppId;
  setApp: (app: AppId) => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

const STORAGE_KEY = 'lad_app';

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [app, setAppState] = useState<AppId>('food');
  const pathname = usePathname();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'food' || stored === 'finance' || stored === 'future') setAppState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-app', app);
  }, [app]);

  const setApp = useCallback((next: AppId) => {
    setAppState(next);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Keep the tint in sync when the user navigates directly (a link, a
  // refresh) rather than through the app-switcher menu.
  useEffect(() => {
    const match = ROUTE_APP.find(([re]) => re.test(pathname ?? ''));
    if (match) setApp(match[1]);
  }, [pathname, setApp]);

  return <AppModeContext.Provider value={{ app, setApp }}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider');
  return ctx;
}
