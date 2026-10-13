import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { familyMock, familyOf } from './family-mock';
import { ApiError, familyApi, financeApi, menuApi, recipesApi, tasksApi, FamilyOverview, Task } from '@/lib/api';
import { deriveScope } from '@/lib/family-scope';
import FamilySection from '@/components/FamilySection';
import ScopeSwitch from '@/components/ScopeSwitch';
import SpendingPage from '@/app/finance/spending/page';
import WalletsPage from '@/app/finance/wallets/page';
import MenuPage from '@/app/menu/page';
import PlanPage from '@/app/future/plan/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const mocked = (o: object) => Object.fromEntries(Object.keys(o).map((k) => [k, vi.fn()]));
  return {
    ...actual,
    familyApi: mocked(actual.familyApi),
    financeApi: mocked(actual.financeApi),
    menuApi: mocked(actual.menuApi),
    recipesApi: mocked(actual.recipesApi),
    tasksApi: mocked(actual.tasksApi),
  };
});

const fam = vi.mocked(familyApi);
const fin = vi.mocked(financeApi);
const menu = vi.mocked(menuApi);
const recipes = vi.mocked(recipesApi);
const tasks = vi.mocked(tasksApi);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 14, 9, 0));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deriveScope', () => {
  it('is always personal outside a family', () => {
    expect(deriveScope({ family: null, invitations: [] }, 'family')).toEqual({ scope: 'personal', canEdit: true });
    expect(deriveScope(null, 'family')).toEqual({ scope: 'personal', canEdit: true });
  });
  it('lets only admins change family data', () => {
    expect(deriveScope(familyOf('admin'), 'family')).toEqual({ scope: 'family', canEdit: true });
    expect(deriveScope(familyOf('member'), 'family')).toEqual({ scope: 'family', canEdit: false });
    expect(deriveScope(familyOf('member'), 'personal')).toEqual({ scope: 'personal', canEdit: true });
  });
});

describe('scope switch', () => {
  it('is hidden without a family', () => {
    renderWithIntl(<ScopeSwitch />);
    expect(screen.queryByTestId('scope-switch')).not.toBeInTheDocument();
  });

  it('switches between mine and the family, marking view-only', async () => {
    familyMock.set({ overview: familyOf('member') });
    const user = userEvent.setup();
    renderWithIntl(<ScopeSwitch />);
    expect(screen.getByRole('radio', { name: 'Mine' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('View only')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Family · Smiths' }));
    expect(screen.getByRole('radio', { name: 'Family · Smiths' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('View only')).toBeInTheDocument();
  });
});

describe('family section on the profile', () => {
  const after = (overview: FamilyOverview) => Promise.resolve(overview);

  it('creates a family', async () => {
    fam.create.mockReturnValue(after(familyOf('admin')));
    const user = userEvent.setup();
    renderWithIntl(<FamilySection />);
    await user.type(screen.getByLabelText('Family name'), 'Smiths');
    await user.click(screen.getByRole('button', { name: 'Create a family' }));
    expect(fam.create).toHaveBeenCalledWith('Smiths');
    expect(await screen.findByRole('heading', { name: 'Smiths' })).toBeInTheDocument();
  });

  it('accepts or declines an invitation', async () => {
    familyMock.set({ overview: { family: null, invitations: [{ id: 7, familyName: 'Smiths', invitedBy: 'anna@test.dev' }] } });
    fam.accept.mockReturnValue(after(familyOf('member')));
    const user = userEvent.setup();
    renderWithIntl(<FamilySection />);
    expect(screen.getByTestId('invitation')).toHaveTextContent('“Smiths” — invited by anna@test.dev');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    expect(fam.accept).toHaveBeenCalledWith(7);
    expect(await screen.findByRole('heading', { name: 'Smiths' })).toBeInTheDocument();
    expect(screen.queryByTestId('invitation')).not.toBeInTheDocument();
  });

  it('admins invite, change roles, remove people and cancel invites', async () => {
    familyMock.set({ overview: familyOf('admin', { invites: [{ id: 9, email: 'kid@test.dev' }] }) });
    fam.invite.mockImplementation((email) => after(familyOf('admin', { invites: [{ id: 9, email: 'kid@test.dev' }, { id: 10, email }] })));
    fam.setRole.mockReturnValue(after(familyOf('admin', { invites: [{ id: 9, email: 'kid@test.dev' }] })));
    fam.remove.mockReturnValue(after(familyOf('admin')));
    fam.cancelInvite.mockReturnValue(after(familyOf('admin')));
    const user = userEvent.setup();
    renderWithIntl(<FamilySection />);

    expect(screen.getByText('2 more people can join')).toBeInTheDocument(); // 2 members + 1 invite of 5
    await user.type(screen.getByLabelText('Email to invite'), 'grandma@test.dev');
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    expect(fam.invite).toHaveBeenCalledWith('grandma@test.dev');
    expect(await screen.findByText('grandma@test.dev')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Role of anna@test.dev'), 'admin');
    expect(fam.setRole).toHaveBeenCalledWith(2, 'admin');

    await user.click(screen.getByRole('button', { name: 'Cancel the invite for kid@test.dev' }));
    expect(fam.cancelInvite).toHaveBeenCalledWith(9);

    await user.click(screen.getByRole('button', { name: 'Remove anna@test.dev from the family?' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }));
    expect(fam.remove).toHaveBeenCalledWith(2);
  });

  it('members only see the people, no controls', () => {
    familyMock.set({ overview: familyOf('member') });
    renderWithIntl(<FamilySection />);
    expect(screen.getAllByTestId('family-member')).toHaveLength(2);
    expect(screen.queryByLabelText('Email to invite')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Role of/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave the family' })).toBeInTheDocument();
  });

  it('warns the last person that leaving deletes the family', async () => {
    familyMock.set({ overview: familyOf('admin', { members: [{ userId: 1, email: 'me@test.dev', role: 'admin', isMe: true }] }) });
    fam.leave.mockReturnValue(after({ family: null, invitations: [] }));
    const user = userEvent.setup();
    renderWithIntl(<FamilySection />);
    await user.click(screen.getByRole('button', { name: 'Leave the family' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('the family and all its shared budget, plans and menu will be deleted');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Yes' }));
    expect(fam.leave).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Create a family' })).toBeInTheDocument();
  });

  it('explains why the last admin cannot step down', async () => {
    familyMock.set({ overview: familyOf('admin') });
    fam.setRole.mockRejectedValue(new ApiError(409, null, 'A family needs at least one admin'));
    const user = userEvent.setup();
    renderWithIntl(<FamilySection />);
    await user.selectOptions(screen.getByLabelText('Role of me@test.dev'), 'member');
    expect(await screen.findByText(/needs at least one admin/)).toBeInTheDocument();
  });
});

describe('family data in the apps', () => {
  const wallet = (id: number, name: string, family: boolean, balance = 0) => ({ id, name, initialBalance: 0, balance, family });

  beforeEach(() => {
    fin.wallets.mockImplementation(async (scope) => (scope === 'family' ? [wallet(5, 'Family budget', true, 500)] : [wallet(1, 'Cash', false, 1000)]));
    fin.categories.mockResolvedValue([]);
    fin.summary.mockResolvedValue({ income: 0, expense: 0, net: 0, byCategory: [] });
    fin.transactions.mockResolvedValue([
      { id: 1, type: 'income', amount: 500, note: '', date: '2026-10-14', walletId: 5, walletName: 'Family budget', categoryId: null, categoryName: null, transfer: true, author: 'anna@test.dev' },
    ]);
  });

  it('a member sees the family budget read-only, with who logged what', async () => {
    familyMock.set({ overview: familyOf('member'), chosen: 'family' });
    renderWithIntl(<SpendingPage />);
    const row = await screen.findByTestId('tx-row');
    expect(fin.transactions).toHaveBeenCalledWith(expect.any(Object), 'family');
    expect(within(row).getByText('⇄ Transfer')).toBeInTheDocument();
    expect(within(row).getByText('anna@test.dev')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument(); // no entry form
  });

  it('an admin moves money from a personal wallet into the family budget', async () => {
    familyMock.set({ overview: familyOf('admin') });
    fin.transfer.mockResolvedValue({ transferId: 'x' });
    const user = userEvent.setup();
    renderWithIntl(<WalletsPage />);
    const card = await screen.findByTestId('transfer-card');
    await waitFor(() => expect(within(card).getByLabelText('To')).toHaveValue('5'));
    expect(within(card).getByLabelText('From')).toHaveValue('1');
    await user.type(within(card).getByLabelText('Amount'), '500');
    await user.click(within(card).getByRole('button', { name: 'Move' }));
    expect(fin.transfer).toHaveBeenCalledWith({ fromWalletId: 1, toWalletId: 5, amount: 500, date: '2026-10-14' });
    expect(await within(card).findByRole('status')).toHaveTextContent('Moved.');
  });

  it('a member can’t move money into the family budget', async () => {
    familyMock.set({ overview: familyOf('member') });
    renderWithIntl(<WalletsPage />);
    await screen.findAllByTestId('wallet-card');
    // only one wallet of their own and no access to the family's — nothing to move between
    expect(screen.queryByTestId('transfer-card')).not.toBeInTheDocument();
    expect(fin.wallets).not.toHaveBeenCalledWith('family');
  });

  it('the family menu is view-only for members and shows who added each dish', async () => {
    familyMock.set({ overview: familyOf('member'), chosen: 'family' });
    recipes.liked.mockResolvedValue([]);
    menu.getWeek.mockResolvedValue({
      weekStart: '2026-10-12',
      weekTotal: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      days: Array.from({ length: 7 }, (_, i) => ({
        date: `2026-10-${12 + i}`,
        meals: i === 2 ? [{ entryId: 1, mealType: 'dinner' as const, recipeId: 7, recipeName: 'Pasta', servings: 4, addedBy: 'anna@test.dev', calories: 600, protein: 0, fat: 0, carbs: 0 }] : [],
        total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      })),
    });
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    const wed = await screen.findByTestId('day-2026-10-14');
    expect(menu.getWeek).toHaveBeenCalledWith('2026-10-12', 'family');
    expect(within(wed).getByText('added by anna@test.dev')).toBeInTheDocument();
    expect(screen.getByText(/only family admins can change it/)).toBeInTheDocument();

    await user.click(within(wed).getByRole('button'));
    expect(wed).toHaveAttribute('data-expanded', '0'); // nothing opens
  });

  it('family plans: members only view; admins settle in the family budget', async () => {
    const task: Task = { id: 3, title: 'Shopping', notes: '', date: '2026-10-14', done: false, source: 'food' };
    tasks.list.mockResolvedValue([task]);

    familyMock.set({ overview: familyOf('member'), chosen: 'family' });
    const { unmount } = renderWithIntl(<PlanPage />);
    const wed = await screen.findByTestId('plan-day-2026-10-14');
    expect(tasks.list).toHaveBeenCalledWith('2026-10-12', '2026-10-18', 'family');
    expect(within(wed).getByRole('checkbox')).toBeDisabled();
    expect(within(wed).queryByRole('link', { name: /Settle/ })).not.toBeInTheDocument();
    expect(within(wed).queryByLabelText(/Add a task/)).not.toBeInTheDocument();
    expect(within(wed).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    unmount();

    familyMock.set({ overview: familyOf('admin'), chosen: 'family' });
    renderWithIntl(<PlanPage />);
    const link = within(await screen.findByTestId('plan-day-2026-10-14')).getByRole('link', { name: /Settle/ });
    expect(new URL(link.getAttribute('href')!, 'http://x').searchParams.get('scope')).toBe('family');
  });

  it('settling a family task opens the family budget', async () => {
    familyMock.set({ overview: familyOf('admin') });
    window.history.replaceState(null, '', '/finance/spending?task=3&title=Shopping&source=food&scope=family');
    renderWithIntl(<SpendingPage />);
    await screen.findByTestId('settle-banner');
    await waitFor(() => expect(fin.wallets).toHaveBeenLastCalledWith('family'));
  });
});
