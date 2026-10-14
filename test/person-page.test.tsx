import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { ApiError, peopleApi, PersonProfile } from '@/lib/api';
import PersonPage from '@/app/u/[username]/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    peopleApi: { profile: vi.fn(), followers: vi.fn(), following: vi.fn(), follow: vi.fn(), unfollow: vi.fn() },
  };
});
let username = 'ivan';
vi.mock('next/navigation', async () => {
  const { mockRouter } = await import('./router-mock');
  return {
    useRouter: () => mockRouter,
    usePathname: () => `/u/${username}`,
    useParams: () => ({ username }),
    useSearchParams: () => new URLSearchParams(),
  };
});

const people = vi.mocked(peopleApi);

const ivan: PersonProfile = {
  username: 'ivan',
  name: 'Ivan Petrov',
  joinedAt: '2026-02-01T10:00:00Z',
  isMe: false,
  followedByMe: false,
  followers: 2,
  following: 1,
  recipes: [
    { id: 5, name: 'Plov', isPublic: true, isMine: false, autoTranslated: false, liked: false, servings: 4, calories: 900, author: { username: 'ivan', name: 'Ivan Petrov', followed: false } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  username = 'ivan';
  people.profile.mockResolvedValue(ivan);
});

describe('someone’s public page', () => {
  it('shows their name, username, counts and public recipes', async () => {
    renderWithIntl(<PersonPage />);
    expect(await screen.findByTestId('person-name')).toHaveTextContent('Ivan Petrov');
    expect(screen.getByText('@ivan')).toBeInTheDocument();
    expect(screen.getByText('Plov')).toBeInTheDocument();
    expect(people.profile).toHaveBeenCalledWith('ivan');
  });

  it('follows and unfollows, updating the follower count', async () => {
    const u = userEvent.setup();
    people.follow.mockResolvedValue({ followedByMe: true, followers: 3 });
    people.unfollow.mockResolvedValue({ followedByMe: false, followers: 2 });
    renderWithIntl(<PersonPage />);

    await u.click(await screen.findByRole('button', { name: 'Follow' }));
    expect(people.follow).toHaveBeenCalledWith('ivan');
    expect(await screen.findByRole('button', { name: 'Unfollow' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /3 Followers/ })).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Unfollow' }));
    expect(people.unfollow).toHaveBeenCalledWith('ivan');
    expect(await screen.findByRole('button', { name: /2 Followers/ })).toBeInTheDocument();
  });

  it('lists followers, with a follow button for everyone but me', async () => {
    const u = userEvent.setup();
    people.followers.mockResolvedValue([
      { username: 'olga', name: null, isMe: false, followedByMe: false },
      { username: 'anna', name: 'Anna Smith', isMe: true, followedByMe: false },
    ]);
    renderWithIntl(<PersonPage />);
    await u.click(await screen.findByRole('tab', { name: 'Followers' }));

    const rows = await screen.findAllByTestId('person-row');
    expect(rows[0]).toHaveTextContent('@olga');
    expect(rows[0].querySelector('a')).toHaveAttribute('href', '/u/olga');
    expect(rows[1]).toHaveTextContent('Anna Smith');
    expect(rows[1]).toHaveTextContent('You');
    expect(screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(2); // Ivan + Olga
  });

  it('offers editing instead of following on my own page', async () => {
    people.profile.mockResolvedValue({ ...ivan, isMe: true });
    renderWithIntl(<PersonPage />);
    expect(await screen.findByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile?tab=settings');
    expect(screen.queryByRole('button', { name: 'Follow' })).toBeNull();
  });

  it('says so when there is no such user', async () => {
    username = 'ghost';
    people.profile.mockRejectedValue(new ApiError(404, null));
    renderWithIntl(<PersonPage />);
    await waitFor(() => expect(screen.getByText('There’s no such user')).toBeInTheDocument());
  });
});
