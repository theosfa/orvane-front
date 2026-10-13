import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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
});
