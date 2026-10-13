import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { ApiError, financeApi } from '@/lib/api';
import SpendingPage from '@/app/finance/spending/page';
import WalletsPage from '@/app/finance/wallets/page';
import CategoriesPage from '@/app/finance/categories/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const fns = Object.fromEntries(Object.keys(actual.financeApi).map((k) => [k, vi.fn()]));
  return { ...actual, financeApi: fns };
});

const api = vi.mocked(financeApi);

const wallets = [
  { id: 1, name: 'Cash', initialBalance: 0, balance: 0 },
  { id: 2, name: 'Card', initialBalance: 100, balance: 42.5 },
];
const categories = [
  { id: 10, name: 'Cafe', type: 'expense' as const },
  { id: 11, name: 'Coffee', type: 'expense' as const },
  { id: 20, name: 'Salary', type: 'income' as const },
];
const emptySummary = { income: 0, expense: 0, net: 0, byCategory: [] };

beforeEach(() => {
  vi.clearAllMocks();
  api.wallets.mockResolvedValue(wallets);
  api.categories.mockResolvedValue(categories);
  api.transactions.mockResolvedValue([]);
  api.summary.mockResolvedValue(emptySummary);
});

describe('Entries page', () => {
  it('logs an income with the chosen category, wallet and date', async () => {
    api.createTransaction.mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderWithIntl(<SpendingPage />);

    await user.click(await screen.findByRole('radio', { name: 'Income' }));
    // only income categories are offered now
    expect(screen.queryByRole('button', { name: 'Cafe' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salary' }));
    await user.type(screen.getByLabelText('Amount'), '1500,5');
    await user.type(screen.getByLabelText('Note'), 'October');
    // the entry form comes before the filters
    await user.selectOptions(screen.getAllByLabelText('Wallet')[0], '2');
    const date = screen.getByLabelText('Date');
    await user.clear(date);
    await user.type(date, '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Add income' }));

    expect(api.createTransaction).toHaveBeenCalledWith({
      type: 'income',
      amount: 1500.5,
      note: 'October',
      date: '2026-10-01',
      walletId: 2,
      categoryId: 20,
    });
    // balances and the list reload after saving
    await waitFor(() => expect(api.wallets).toHaveBeenCalledTimes(2));
  });

  it('rejects an invalid amount without calling the API', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SpendingPage />);
    await user.type(await screen.findByLabelText('Amount'), '12.345');
    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByText('Enter an amount, e.g. 12.50')).toBeInTheDocument();
    expect(api.createTransaction).not.toHaveBeenCalled();
  });

  it('filters by period and category and shows the summary', async () => {
    api.summary.mockResolvedValue({
      income: 0,
      expense: 10.3,
      net: -10.3,
      byCategory: [{ type: 'expense', categoryId: 10, name: 'Cafe', total: 10.3, count: 2 }],
    });
    const user = userEvent.setup();
    renderWithIntl(<SpendingPage />);
    await screen.findByText('By category');

    await user.click(screen.getByRole('button', { name: 'Last month' }));
    const selects = screen.getAllByLabelText('Category');
    await user.selectOptions(selects[selects.length - 1], '10');

    await waitFor(() =>
      expect(api.summary).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: 10, from: expect.any(String), to: expect.any(String) })),
    );
    expect(api.transactions).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: 10 }));
    expect(screen.getByTestId('sum-expense')).toHaveTextContent('€10.30');
  });

  it('asks before deleting an entry', async () => {
    api.transactions.mockResolvedValue([
      { id: 5, type: 'expense', amount: 4, note: 'Latte', date: '2026-10-02', walletId: 1, walletName: 'Cash', categoryId: 11, categoryName: 'Coffee' },
    ]);
    api.deleteTransaction.mockResolvedValue({ removed: true });
    const user = userEvent.setup();
    renderWithIntl(<SpendingPage />);
    const row = await screen.findByTestId('tx-row');
    await user.click(within(row).getByRole('button', { name: 'Remove' }));

    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(api.deleteTransaction).not.toHaveBeenCalled();

    await user.click(within(row).getByRole('button', { name: 'Remove' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    expect(api.deleteTransaction).toHaveBeenCalledWith(5);
  });
});

describe('Wallets page', () => {
  it('creates a wallet with a negative starting balance', async () => {
    api.createWallet.mockResolvedValue(wallets[0]);
    const user = userEvent.setup();
    renderWithIntl(<WalletsPage />);
    await user.type(await screen.findByLabelText('Wallet name'), 'Credit card');
    await user.type(screen.getByLabelText('Starting balance'), '-200');
    await user.click(screen.getByRole('button', { name: 'Add wallet' }));
    expect(api.createWallet).toHaveBeenCalledWith({ name: 'Credit card', initialBalance: -200 });
  });

  it('only lets a zero-balance wallet be deleted', async () => {
    api.deleteWallet.mockResolvedValue({ removed: true });
    const user = userEvent.setup();
    renderWithIntl(<WalletsPage />);
    const [cash, card] = await screen.findAllByTestId('wallet-card');

    expect(within(card).getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(within(card).getByText('Only a wallet with a zero balance can be deleted')).toBeInTheDocument();

    await user.click(within(cash).getByRole('button', { name: 'Remove' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete wallet “Cash”?');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    expect(api.deleteWallet).toHaveBeenCalledWith(1);
  });

  it('shows the server refusal when the balance changed meanwhile', async () => {
    api.deleteWallet.mockRejectedValue(new ApiError(409, null, 'not zero'));
    const user = userEvent.setup();
    renderWithIntl(<WalletsPage />);
    const [cash] = await screen.findAllByTestId('wallet-card');
    await user.click(within(cash).getByRole('button', { name: 'Remove' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Only a wallet with a zero balance can be deleted', { selector: 'p' })).toBeInTheDocument();
  });

  it('renames a wallet and changes its starting balance', async () => {
    api.updateWallet.mockResolvedValue(wallets[1]);
    const user = userEvent.setup();
    renderWithIntl(<WalletsPage />);
    const [, card] = await screen.findAllByTestId('wallet-card');
    await user.click(within(card).getByRole('button', { name: 'Edit' }));
    const name = within(card).getByLabelText('Wallet name');
    await user.clear(name);
    await user.type(name, 'Visa');
    await user.click(within(card).getByRole('button', { name: 'Save' }));
    expect(api.updateWallet).toHaveBeenCalledWith(2, { name: 'Visa', initialBalance: 100 });
  });
});

describe('Categories page', () => {
  it('adds, renames and deletes categories per type', async () => {
    api.createCategory.mockResolvedValue(categories[0]);
    api.renameCategory.mockResolvedValue(categories[0]);
    api.deleteCategory.mockResolvedValue({ removed: true });
    const user = userEvent.setup();
    renderWithIntl(<CategoriesPage />);

    const income = await screen.findByTestId('column-income');
    await user.type(within(income).getByLabelText('New income category'), 'Bonus');
    await user.click(within(income).getByRole('button', { name: 'Add' }));
    expect(api.createCategory).toHaveBeenCalledWith({ name: 'Bonus', type: 'income' });

    const expense = screen.getByTestId('column-expense');
    const cafe = within(expense).getAllByTestId('category-row')[0];
    await user.click(within(cafe).getByRole('button', { name: 'Rename' }));
    const input = within(cafe).getByLabelText('Rename');
    await user.clear(input);
    await user.type(input, 'Restaurants');
    await user.click(within(cafe).getByRole('button', { name: 'Save' }));
    expect(api.renameCategory).toHaveBeenCalledWith(10, 'Restaurants');

    await user.click(within(cafe).getByRole('button', { name: 'Remove Cafe' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    expect(api.deleteCategory).toHaveBeenCalledWith(10);
  });

  it('shows a duplicate-name error', async () => {
    api.createCategory.mockRejectedValue(new ApiError(409, null, 'exists'));
    const user = userEvent.setup();
    renderWithIntl(<CategoriesPage />);
    const expense = await screen.findByTestId('column-expense');
    await user.type(within(expense).getByLabelText('New expense category'), 'coffee');
    await user.click(within(expense).getByRole('button', { name: 'Add' }));
    expect(await within(expense).findByText('That name is already taken')).toBeInTheDocument();
  });
});
