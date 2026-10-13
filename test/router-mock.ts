import { vi } from 'vitest';

// one router shared by the next/navigation mock and the tests that check navigation
export const mockRouter = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() };
