import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { familyMock, familyOf } from './family-mock';
import { mockRouter } from './router-mock';
import { ApiError, peopleApi, recipesApi, statsApi, PersonProfile, RecipeListItem } from '@/lib/api';
import { announceFamilyChange } from '@/lib/family-live';
import ProfilePage from '@/app/profile/page';

const user = {
  id: 1,
  email: 'me@test.dev',
  createdAt: '2026-01-05T10:00:00Z',
  language: 'en',
  username: 'anna',
  firstName: 'Anna',
  lastName: 'Smith',
  showFullName: false,
};
const updateProfile = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user, logout: vi.fn(), updateLanguage: vi.fn(), updateProfile }),
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    recipesApi: { list: vi.fn(), liked: vi.fn() },
    statsApi: { mine: vi.fn() },
    peopleApi: { profile: vi.fn() },
    familyApi: { overview: vi.fn() },
  };
});
// the family block has its own tests
vi.mock('@/components/FamilySection', () => ({ default: () => <section data-testid="family-block" /> }));

const stats = vi.mocked(statsApi);

const recipe = (id: number, name: string, isPublic: boolean, isMine = true): RecipeListItem => ({
  id, name, isPublic, isMine, autoTranslated: false, liked: false, servings: 1, calories: 300, author: { username: 'anna', name: null, followed: false },
});
const me: PersonProfile = {
  username: 'anna', name: null, joinedAt: user.createdAt, isMe: true, followedByMe: false, followers: 4, following: 2,
  recipes: [recipe(1, 'Open soup', true)],
};

// the tab lives in the URL; the mocked router writes it there
function routeTo(url: string) {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  vi.clearAllMocks();
  routeTo('/profile');
  mockRouter.replace.mockImplementation((url: string) => routeTo(url));
  stats.mine.mockResolvedValue({ recipesWritten: 3, recipesLiked: 12, weeksPlanned: 1250, tasksDone: 0 });
  vi.mocked(peopleApi.profile).mockResolvedValue(me);
  vi.mocked(recipesApi.list).mockResolvedValue([recipe(1, 'Open soup', true), recipe(2, 'Secret soup', false), recipe(3, 'Their soup', false, false)]);
});

const values = () => screen.getAllByTestId('profile-stat').map((el) => el.textContent);

describe('profile header and numbers', () => {
  it('shows my name, username, followers and real numbers', async () => {
    renderWithIntl(<ProfilePage />);
    expect(screen.getByTestId('person-name')).toHaveTextContent('Anna Smith');
    expect(screen.getByText('@anna')).toBeInTheDocument();
    await waitFor(() => expect(values()).toEqual(['3', '12', '1,250', '0']));
    expect(await screen.findByText('Followers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See your public page' })).toHaveAttribute('href', '/u/anna');
    expect(peopleApi.profile).toHaveBeenCalledWith('anna');
  });

  it('shows dashes and a message when the numbers can’t be loaded', async () => {
    stats.mine.mockRejectedValue(new Error('down'));
    renderWithIntl(<ProfilePage />);
    expect(await screen.findByText('Couldn’t load your numbers')).toBeInTheDocument();
    expect(values()).toEqual(['—', '—', '—', '—']);
  });

  it('refreshes the numbers when the family plans change', async () => {
    renderWithIntl(<ProfilePage />);
    await waitFor(() => expect(values()[0]).toBe('3'));
    stats.mine.mockResolvedValue({ recipesWritten: 3, recipesLiked: 12, weeksPlanned: 1250, tasksDone: 1 });
    act(() => announceFamilyChange('tasks'));
    await waitFor(() => expect(values()[3]).toBe('1'));
  });
});

describe('profile sections', () => {
  const tab = (name: string) => screen.getByRole('tab', { name });

  it('has four sections and starts on the public recipes', async () => {
    renderWithIntl(<ProfilePage />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Public recipes', 'Private recipes', 'Family', 'Settings']);
    expect(tab('Public recipes')).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Open soup')).toBeInTheDocument();
    expect(screen.queryByTestId('author-link')).toBeNull(); // it's my own page
  });

  it('switches sections through the URL: private shows only my private recipes', async () => {
    const u = userEvent.setup();
    const { unmount } = renderWithIntl(<ProfilePage />);
    await u.click(tab('Private recipes'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/profile?tab=private', { scroll: false });
    // the real router re-renders the page with the new URL
    unmount();
    renderWithIntl(<ProfilePage />);
    expect(tab('Private recipes')).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Secret soup')).toBeInTheDocument();
    expect(screen.queryByText('Open soup')).toBeNull();
    expect(screen.queryByText('Their soup')).toBeNull();
  });

  it('opens the family section from the URL and from the family line', async () => {
    familyMock.set({ overview: familyOf('admin') });
    routeTo('/profile?tab=family');
    renderWithIntl(<ProfilePage />);
    expect(screen.getByTestId('family-block')).toBeInTheDocument();
    expect(screen.getByTestId('profile-family')).toHaveTextContent('Family “Smiths” · Admin');
  });
});

describe('settings', () => {
  beforeEach(() => routeTo('/profile?tab=settings'));

  it('saves the username, name and whether others see it', async () => {
    const u = userEvent.setup();
    updateProfile.mockResolvedValue(undefined);
    renderWithIntl(<ProfilePage />);
    const nick = screen.getByLabelText('Username');
    expect(nick).toHaveValue('anna');
    await u.clear(nick);
    await u.type(nick, 'Anna_Cooks');
    await u.click(screen.getByLabelText(/Show my name to others/));
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateProfile).toHaveBeenCalledWith({ username: 'anna_cooks', firstName: 'Anna', lastName: 'Smith', showFullName: true });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });

  it('explains a bad or taken username', async () => {
    const u = userEvent.setup();
    renderWithIntl(<ProfilePage />);
    const nick = screen.getByLabelText('Username');
    await u.clear(nick);
    await u.type(nick, 'no way');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Use 3–30 characters: a–z, 0–9, _ and .')).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();

    updateProfile.mockRejectedValue(new ApiError(409, null));
    await u.clear(nick);
    await u.type(nick, 'bob');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('This username is taken')).toBeInTheDocument();
  });

  it('keeps the language and the links between the apps, as plain text', () => {
    renderWithIntl(<ProfilePage />);
    expect(screen.getByText('App language')).toBeInTheDocument();
    const links = screen.getByText('How the three apps talk to each other').closest('section')!;
    expect(within(links).getByText('Food → Plans').closest('a')).toBeNull();
  });
});
