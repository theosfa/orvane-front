import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from './render';
import { mockRouter } from './router-mock';
import Home from '@/app/page';

const auth = vi.hoisted(() => ({ user: null as null | { email: string }, loading: false }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }));

beforeEach(() => {
  mockRouter.replace.mockReset();
  auth.user = null;
  auth.loading = false;
});

describe('Home (landing)', () => {
  it('shows the landing to guests', () => {
    renderWithIntl(<Home />);
    expect(screen.getAllByRole('link', { name: /./ }).some((a) => a.getAttribute('href') === '/register')).toBe(true);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('sends a logged-in user to the food app', () => {
    auth.user = { email: 'me@test.dev' };
    renderWithIntl(<Home />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/recipes/feed');
    expect(screen.queryByRole('link', { name: /./ })).toBeNull(); // the landing does not flash
  });

  it('waits for the auth check before deciding', () => {
    auth.loading = true;
    renderWithIntl(<Home />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
