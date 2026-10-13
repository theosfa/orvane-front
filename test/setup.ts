import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
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
