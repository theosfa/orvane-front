import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// pages read the family / chosen scope from lib/family-context — tests drive it via familyMock
vi.mock('@/lib/family-context', async () => {
  const { useFamilyMock } = await import('./family-mock');
  return { useFamily: useFamilyMock, FamilyProvider: ({ children }: { children: React.ReactNode }) => children };
});

// Node's own (experimental) localStorage can shadow jsdom's and be unusable — use a plain in-memory one
if (typeof globalThis.localStorage?.clear !== 'function') {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
}

afterEach(async () => {
  cleanup();
  (await import('./family-mock')).familyMock.reset();
  window.history.replaceState(null, '', '/');
});

// pages use the App Router hooks; tests have no router
// set the query string for a test with window.history.replaceState(null, '', '/page?x=1')
vi.mock('next/navigation', async () => {
  const { mockRouter } = await import('./router-mock');
  return {
    useRouter: () => mockRouter,
    usePathname: () => window.location.pathname,
    useParams: () => ({}),
    useSearchParams: () => new URLSearchParams(window.location.search),
  };
});

// RequireAuth needs a logged-in user — tests render the page content directly
vi.mock('@/components/RequireAuth', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
