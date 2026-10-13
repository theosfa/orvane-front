import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { tasksApi, Task } from '@/lib/api';
import PlanPage from '@/app/future/plan/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, tasksApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() } };
});

const api = vi.mocked(tasksApi);

const shopping: Task = {
  id: 1,
  title: 'Shopping list · Mon, Oct 12 – Tue, Oct 13',
  notes: 'Pasta — 500 g\nTomatoes — 333 g',
  date: '2026-10-15',
  done: false,
  source: 'food',
};
const call: Task = { id: 2, title: 'Call the bank', notes: '', date: '2026-10-14', done: true, source: 'manual' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 14, 9, 0)); // Wednesday
  vi.clearAllMocks();
  api.list.mockImplementation(async (from: string) => (from === '2026-10-12' ? [call, shopping] : []));
});

afterEach(() => {
  vi.useRealTimers();
});

const dayCard = (date: string) => screen.getByTestId(`plan-day-${date}`);

describe('Plans week', () => {
  it('shows the 7 days of the week with their dates and tasks', async () => {
    renderWithIntl(<PlanPage />);
    expect(await screen.findByTestId('week-range')).toHaveTextContent('Oct 12 – Oct 18, 2026');
    expect(api.list).toHaveBeenCalledWith('2026-10-12', '2026-10-18');
    for (const d of ['12', '13', '14', '15', '16', '17', '18']) {
      expect(screen.getByTestId(`plan-day-2026-10-${d}`)).toBeInTheDocument();
    }
    expect(within(dayCard('2026-10-14')).getByText('Today')).toBeInTheDocument();
    expect(within(dayCard('2026-10-14')).getByText('Call the bank')).toBeInTheDocument();
    expect(screen.getByText('1 open task this week')).toBeInTheDocument();
  });

  it('shows tasks sent by other apps with their source and details', async () => {
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const thursday = await screen.findByTestId('plan-day-2026-10-15');
    expect(within(thursday).getByText('From Food')).toBeInTheDocument();
    expect(within(thursday).queryByText('Pasta — 500 g')).not.toBeInTheDocument();
    await user.click(within(thursday).getByRole('button', { name: 'Show 2 lines' }));
    expect(within(thursday).getByText('Pasta — 500 g')).toBeInTheDocument();
  });

  it('adds a task to a specific day', async () => {
    api.create.mockResolvedValue({ id: 3, title: 'Gym', notes: '', date: '2026-10-16', done: false, source: 'manual' });
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const friday = await screen.findByTestId('plan-day-2026-10-16');
    await user.type(within(friday).getByLabelText('Add a task for Friday, October 16'), 'Gym{Enter}');
    expect(api.create).toHaveBeenCalledWith({ title: 'Gym', date: '2026-10-16' });
    expect(await within(friday).findByText('Gym')).toBeInTheDocument();
  });

  it('ticks a task off and rolls back if saving fails', async () => {
    api.update.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(shopping);
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const thursday = await screen.findByTestId('plan-day-2026-10-15');
    const box = within(thursday).getByRole('checkbox');

    await user.click(box);
    expect(api.update).toHaveBeenCalledWith(1, { done: true });
    await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'false')); // rolled back

    await user.click(box);
    expect(box).toHaveAttribute('aria-checked', 'true');
  });

  it('deletes a task', async () => {
    api.remove.mockResolvedValue({ removed: true });
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const wednesday = await screen.findByTestId('plan-day-2026-10-14');
    await user.click(within(wednesday).getByRole('button', { name: 'Remove Call the bank' }));
    expect(api.remove).toHaveBeenCalledWith(2);
    expect(within(wednesday).queryByText('Call the bank')).not.toBeInTheDocument();
  });

  it('browses previous and next weeks', async () => {
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    await screen.findByTestId('plan-day-2026-10-12');
    expect(screen.getByTestId('week-slide')).not.toHaveAttribute('data-dir');
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith('2026-10-19', '2026-10-25'));
    expect(await screen.findByTestId('plan-day-2026-10-25')).toBeInTheDocument();
    expect(screen.getByTestId('week-slide')).toHaveAttribute('data-dir', 'next');
    // the old week's tasks never show under the new dates
    expect(screen.queryByText('Call the bank')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous week' }));
    await user.click(screen.getByRole('button', { name: 'Previous week' }));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith('2026-10-05', '2026-10-11'));
    expect(await screen.findByTestId('plan-day-2026-10-05')).toBeInTheDocument();
    expect(screen.getByTestId('week-slide')).toHaveAttribute('data-dir', 'prev');
  });

  it('widens a day on hover (desktop) — days sit in the shared week columns', async () => {
    renderWithIntl(<PlanPage />);
    const day = await screen.findByTestId('plan-day-2026-10-14');
    expect(day.closest('.week-column')).not.toBeNull();
    expect(day.closest('.week-columns')).not.toBeNull();
  });

  it('opens a clicked day over the whole screen with every detail shown', async () => {
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const thursday = await screen.findByTestId('plan-day-2026-10-15');

    // the task controls inside the day don't open it
    await user.click(within(thursday).getByRole('button', { name: 'Show 2 lines' }));
    expect(screen.queryByTestId('day-focus')).not.toBeInTheDocument();

    await user.click(thursday);
    const focus = screen.getByRole('dialog', { name: 'Thursday, October 15, 2026' });
    // rendered at the top of the page, not inside the week
    expect(focus.parentElement).toBe(document.body);
    expect(within(focus).getByText('Pasta — 500 g')).toBeInTheDocument(); // details open
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('day-focus')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('steps through days in the opened view, into the next week', async () => {
    api.list.mockImplementation(async (from: string) =>
      from === '2026-10-12' ? [call, shopping] : from === '2026-10-19' ? [{ ...call, id: 9, title: 'Dentist', date: '2026-10-19', done: false }] : [],
    );
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    await user.click(within(await screen.findByTestId('plan-day-2026-10-18')).getByRole('button', { name: 'Open Sunday, October 18' }));
    expect(screen.getByRole('dialog', { name: 'Sunday, October 18, 2026' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next day' }));
    const monday = await screen.findByRole('dialog', { name: 'Monday, October 19, 2026' });
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith('2026-10-19', '2026-10-25'));
    expect(await within(monday).findByText('Dentist')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(await screen.findByRole('dialog', { name: 'Sunday, October 18, 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('day-focus')).not.toBeInTheDocument();
  });

  it('adds and ticks tasks inside the opened day', async () => {
    api.create.mockResolvedValue({ id: 5, title: 'Pharmacy', notes: '', date: '2026-10-15', done: false, source: 'manual' });
    api.update.mockResolvedValue(shopping);
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    await user.click(await screen.findByTestId('plan-day-2026-10-15'));
    const focus = screen.getByTestId('day-focus');

    await user.type(within(focus).getByLabelText(/Add a task for/), 'Pharmacy{Enter}');
    expect(api.create).toHaveBeenCalledWith({ title: 'Pharmacy', date: '2026-10-15' });
    expect(await within(focus).findByText('Pharmacy')).toBeInTheDocument();

    await user.click(within(focus).getByRole('checkbox', { name: shopping.title }));
    expect(api.update).toHaveBeenCalledWith(1, { done: true });
  });

  it('links open tasks to Finance to settle them', async () => {
    const user = userEvent.setup();
    renderWithIntl(<PlanPage />);
    const thursday = await screen.findByTestId('plan-day-2026-10-15');
    const link = within(thursday).getByRole('link', { name: `€ Settle in Finance: ${shopping.title}` });
    const url = new URL(link.getAttribute('href')!, 'http://x');
    expect(url.pathname).toBe('/finance/spending');
    expect(Object.fromEntries(url.searchParams)).toEqual({ task: '1', title: shopping.title, source: 'food' });

    // done tasks have nothing to settle
    expect(within(screen.getByTestId('plan-day-2026-10-14')).queryByRole('link', { name: /Settle/ })).not.toBeInTheDocument();

    await user.click(thursday);
    expect(within(screen.getByTestId('day-focus')).getByRole('link', { name: '€ Settle in Finance' })).toHaveAttribute('href', link.getAttribute('href'));
  });
});
