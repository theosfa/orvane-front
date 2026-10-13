import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// pages use the App Router hooks; tests have no router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// RequireAuth needs a logged-in user — tests render the page content directly
vi.mock('@/components/RequireAuth', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
