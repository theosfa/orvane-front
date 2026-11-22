import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from './render';
import { mockRouter } from './router-mock';
import { authApi } from '@/lib/api';
import GoogleSignIn from '@/components/GoogleSignIn';

const loginWithGoogle = vi.fn();
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ loginWithGoogle }) }));
vi.mock('@/lib/theme-context', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, authApi: { googleConfig: vi.fn() } };
});

const config = vi.mocked(authApi.googleConfig);
let callback: ((r: { credential?: string }) => void) | null = null;
const gsi = {
  initialize: vi.fn((opts: { callback: (r: { credential?: string }) => void }) => {
    callback = opts.callback;
  }),
  renderButton: vi.fn((el: HTMLElement) => {
    el.innerHTML = '<div role="button">Continue with Google</div>';
  }),
};

beforeEach(() => {
  vi.clearAllMocks();
  callback = null;
  window.google = { accounts: { id: gsi } };
});

describe('GoogleSignIn', () => {
  it('stays hidden when the server has no Google Client ID', async () => {
    config.mockResolvedValue({ clientId: null });
    renderWithIntl(<GoogleSignIn />);
    await waitFor(() => expect(config).toHaveBeenCalled());
    expect(screen.queryByTestId('google-signin')).toBeNull();
    expect(gsi.renderButton).not.toHaveBeenCalled();
  });

  it('renders the Google button and opens the app after signing in', async () => {
    config.mockResolvedValue({ clientId: 'abc.apps.googleusercontent.com' });
    loginWithGoogle.mockResolvedValue(undefined);
    renderWithIntl(<GoogleSignIn />);

    expect(await screen.findByText('or with email')).toBeInTheDocument();
    await waitFor(() => expect(gsi.renderButton).toHaveBeenCalled());
    expect(gsi.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'abc.apps.googleusercontent.com' }));
    expect(gsi.renderButton.mock.calls[0][1]).toMatchObject({ text: 'continue_with', locale: 'en', theme: 'outline' });

    await act(async () => callback!({ credential: 'id-token' }));
    expect(loginWithGoogle).toHaveBeenCalledWith('id-token');
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/recipes/feed'));
  });

  it('shows an error when Google sign-in fails', async () => {
    config.mockResolvedValue({ clientId: 'abc.apps.googleusercontent.com' });
    loginWithGoogle.mockRejectedValue(new Error('401'));
    renderWithIntl(<GoogleSignIn />);
    await waitFor(() => expect(gsi.renderButton).toHaveBeenCalled());

    await act(async () => callback!({ credential: 'bad' }));
    expect(await screen.findByText('Couldn’t sign in with Google. Try again.')).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
