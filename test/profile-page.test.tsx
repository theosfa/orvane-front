import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from './render';
import { familyMock, familyOf } from './family-mock';
import { recipesApi, statsApi } from '@/lib/api';
import { announceFamilyChange } from '@/lib/family-live';
import ProfilePage from '@/app/profile/page';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'me@test.dev', createdAt: '2026-01-05T10:00:00Z', language: 'en' },
    logout: vi.fn(),
    updateLanguage: vi.fn(),
  }),
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, recipesApi: { liked: vi.fn() }, statsApi: { mine: vi.fn() }, familyApi: { overview: vi.fn() } };
});
// the family block has its own tests
vi.mock('@/components/FamilySection', () => ({ default: () => <section id="family" /> }));

const stats = vi.mocked(statsApi);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recipesApi.liked).mockResolvedValue([]);
  stats.mine.mockResolvedValue({ recipesWritten: 3, recipesLiked: 12, weeksPlanned: 1250, tasksDone: 0 });
});

const values = () => screen.getAllByTestId('profile-stat').map((el) => el.textContent);

describe('profile', () => {
  it('shows the user’s real numbers, each linking to its page', async () => {
    renderWithIntl(<ProfilePage />);
    await waitFor(() => expect(values()).toEqual(['3', '12', '1,250', '0']));
    expect(screen.getByText('Recipes written').closest('a')).toHaveAttribute('href', '/recipes');
    expect(screen.getByText('Tasks done').closest('a')).toHaveAttribute('href', '/future/plan');
    // nothing made up any more
    expect(screen.queryByText('Edit profile')).toBeNull();
    expect(screen.queryByText(/Waste avoided|186/)).toBeNull();
  });

  it('shows dashes and a message when the numbers can’t be loaded', async () => {
    stats.mine.mockRejectedValue(new Error('down'));
    renderWithIntl(<ProfilePage />);
    expect(await screen.findByText('Couldn’t load your numbers')).toBeInTheDocument();
    expect(values()).toEqual(['—', '—', '—', '—']);
  });

  it('shows the family and role, and refreshes the numbers when the family plans change', async () => {
    familyMock.set({ overview: familyOf('admin') });
    renderWithIntl(<ProfilePage />);
    expect(screen.getByTestId('profile-family')).toHaveTextContent('Family “Smiths” · Admin');
    await waitFor(() => expect(values()[0]).toBe('3'));

    stats.mine.mockResolvedValue({ recipesWritten: 3, recipesLiked: 12, weeksPlanned: 1250, tasksDone: 1 });
    act(() => announceFamilyChange('tasks'));
    await waitFor(() => expect(values()[3]).toBe('1'));
  });

  it('lists the real links between the apps, as plain text', async () => {
    renderWithIntl(<ProfilePage />);
    expect(screen.getByText('Food → Plans').closest('a')).toBeNull();
    expect(screen.getByText('Plans → Finance').closest('a')).toBeNull();
    expect(screen.queryByText('On')).toBeNull();
    expect(screen.queryByText('Off')).toBeNull();
    await waitFor(() => expect(stats.mine).toHaveBeenCalled());
  });
});
