import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { menuApi, recipesApi, tasksApi, WeekMenu, MenuMeal } from '@/lib/api';
import MenuPage from '@/app/menu/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    menuApi: { getWeek: vi.fn(), setDay: vi.fn(), removeEntry: vi.fn(), shoppingList: vi.fn() },
    recipesApi: { liked: vi.fn(), list: vi.fn() },
    tasksApi: { list: vi.fn(), create: vi.fn() },
  };
});

const menu = vi.mocked(menuApi);
const recipes = vi.mocked(recipesApi);
const tasks = vi.mocked(tasksApi);

// "today" is Wednesday 14 Oct 2026 → the week shown is 12–18 Oct
const TODAY = new Date(2026, 9, 14, 10, 0);

function weekOf(monday: string, meals: Record<string, MenuMeal[]> = {}): WeekMenu {
  const [y, m, d] = monday.split('-').map(Number);
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(y, m - 1, d + i);
    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const list = meals[date] ?? [];
    const calories = list.reduce((s, x) => s + x.calories, 0);
    return { date, meals: list, total: { calories, protein: 0, fat: 0, carbs: 0 } };
  });
  return { weekStart: monday, days, weekTotal: { calories: 0, protein: 0, fat: 0, carbs: 0 } };
}

const pasta: MenuMeal = { entryId: 1, mealType: 'dinner', recipeId: 7, recipeName: 'Pasta', servings: 2, calories: 600, protein: 20, fat: 10, carbs: 90 };
const liked = [
  { id: 7, name: 'Pasta', autoTranslated: false, liked: true, isPublic: true, isMine: false, servings: 2, calories: 1200 },
  { id: 8, name: 'Omelette', autoTranslated: false, liked: true, isPublic: true, isMine: true, servings: 1, calories: 300 },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  vi.clearAllMocks();
  menu.getWeek.mockImplementation(async (week?: string) => weekOf(week && week !== '2026-10-14' ? week : '2026-10-12', { '2026-10-12': [pasta] }));
  menu.setDay.mockResolvedValue({ saved: 1 });
  recipes.liked.mockResolvedValue(liked);
});

afterEach(() => {
  vi.useRealTimers();
});

const day = (date: string) => screen.getByTestId(`day-${date}`);
// what a user clicks: the day card
const dayCard = (date: string) => within(day(date)).getByRole('button', { name: /^Edit / });

describe('menu week', () => {
  it('shows the current week with dates and moves to the next and previous weeks', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);

    expect(await screen.findByTestId('week-range')).toHaveTextContent('Oct 12 – Oct 18, 2026');
    expect(menu.getWeek).toHaveBeenCalledWith('2026-10-12');
    expect(within(day('2026-10-12')).getByText('Pasta')).toBeInTheDocument();
    expect(within(day('2026-10-12')).getByText(/for 2 people/)).toBeInTheDocument();
    // no slide on the first load
    expect(screen.getByTestId('week-slide')).not.toHaveAttribute('data-dir');

    await user.click(screen.getByRole('button', { name: 'Next week' }));
    await waitFor(() => expect(menu.getWeek).toHaveBeenLastCalledWith('2026-10-19'));
    expect(await screen.findByTestId('day-2026-10-25')).toBeInTheDocument();
    expect(screen.getByTestId('week-slide')).toHaveAttribute('data-dir', 'next');

    await user.click(screen.getByRole('button', { name: 'Previous week' }));
    await user.click(screen.getByRole('button', { name: 'Previous week' }));
    await waitFor(() => expect(menu.getWeek).toHaveBeenLastCalledWith('2026-10-05'));
    expect(await screen.findByTestId('day-2026-10-05')).toBeInTheDocument();
    expect(screen.getByTestId('week-slide')).toHaveAttribute('data-dir', 'prev');

    await user.click(screen.getByRole('button', { name: 'This week' }));
    await waitFor(() => expect(menu.getWeek).toHaveBeenLastCalledWith('2026-10-12'));
  });

  it('plans a meal from liked recipes only and submits the day', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');

    await user.click(dayCard('2026-10-13'));
    expect(day('2026-10-13')).toHaveAttribute('data-expanded', '1');

    const recipeSelect = within(day('2026-10-13')).getByLabelText('Choose a recipe');
    const options = within(recipeSelect).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Choose a liked recipe', 'Pasta', 'Omelette']);
    expect(recipes.liked).toHaveBeenCalled();
    expect(recipes.list).not.toHaveBeenCalled();

    const people = within(day('2026-10-13')).getByLabelText('People');
    expect(within(people).getAllByRole('option')).toHaveLength(12);

    await user.selectOptions(within(day('2026-10-13')).getByLabelText('Meal'), 'breakfast');
    await user.selectOptions(recipeSelect, '8');
    await user.selectOptions(people, '3');
    await user.click(within(day('2026-10-13')).getByRole('button', { name: 'Submit' }));

    expect(menu.setDay).toHaveBeenCalledWith('2026-10-13', [{ mealType: 'breakfast', recipeId: 8, servings: 3 }]);
    await waitFor(() => expect(day('2026-10-13')).toHaveAttribute('data-expanded', '0'));
  });

  it('can stack several meals and remove existing ones before submitting', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');
    await user.click(dayCard('2026-10-12'));
    const monday = day('2026-10-12');

    await user.selectOptions(within(monday).getByLabelText('Choose a recipe'), '8');
    await user.selectOptions(within(monday).getByLabelText('Meal'), 'lunch');
    await user.click(within(monday).getByRole('button', { name: '+ Add another meal' }));
    expect(within(monday).getAllByTestId('draft-meal')).toHaveLength(2);

    await user.click(within(monday).getByRole('button', { name: 'Remove Pasta' }));
    await user.click(within(monday).getByRole('button', { name: 'Submit' }));
    expect(menu.setDay).toHaveBeenCalledWith('2026-10-12', [{ mealType: 'lunch', recipeId: 8, servings: 2 }]);
  });

  it('keeps other days still while one is being edited', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');
    await user.click(dayCard('2026-10-12'));

    expect(day('2026-10-14')).toHaveAttribute('data-locked', '1');
    // the week stops reacting to hover while editing (see .week-columns[data-editing] in globals.css)
    expect(document.querySelector('.week-columns')).toHaveAttribute('data-editing', '1');
    // hovering or pressing keys on another day does nothing
    fireEvent.mouseEnter(day('2026-10-14'));
    fireEvent.keyDown(within(day('2026-10-14')).getByRole('button'), { key: 'Enter' });
    expect(day('2026-10-12')).toHaveAttribute('data-expanded', '1');
    expect(day('2026-10-14')).toHaveAttribute('data-expanded', '0');
  });

  it('asks before leaving a day with unsaved changes', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');
    await user.click(dayCard('2026-10-13'));
    await user.selectOptions(within(day('2026-10-13')).getByLabelText('Choose a recipe'), '7');

    // click somewhere around the day
    await user.click(screen.getByTestId('edit-backdrop'));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Leave without saving?');
    expect(dialog).toHaveTextContent('will not be saved');

    // decline: still editing, choices kept
    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    expect(day('2026-10-13')).toHaveAttribute('data-expanded', '1');
    expect(within(day('2026-10-13')).getByLabelText('Choose a recipe')).toHaveValue('7');

    // accept: editing ends, nothing saved
    await user.click(screen.getByTestId('edit-backdrop'));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Leave' }));
    expect(day('2026-10-13')).toHaveAttribute('data-expanded', '0');
    expect(menu.setDay).not.toHaveBeenCalled();
  });

  it('closes an untouched day without asking, and Cancel never asks', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');

    await user.click(dayCard('2026-10-15'));
    await user.click(screen.getByTestId('edit-backdrop'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(day('2026-10-15')).toHaveAttribute('data-expanded', '0');

    await user.click(dayCard('2026-10-15'));
    await user.selectOptions(within(day('2026-10-15')).getByLabelText('Choose a recipe'), '7');
    await user.click(within(day('2026-10-15')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(day('2026-10-15')).toHaveAttribute('data-expanded', '0');
  });

  it('tells the user to like recipes when there are none', async () => {
    recipes.liked.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');
    await user.click(dayCard('2026-10-12'));
    expect(within(day('2026-10-12')).getByText(/Like recipes in the feed/)).toBeInTheDocument();
  });
});

describe('shopping list', () => {
  const items = [
    { ingredientId: 1, name: 'Pasta', amount: 500 },
    { ingredientId: 2, name: 'Tomatoes', amount: 333.333 },
  ];

  async function openAndGenerate(user: ReturnType<typeof userEvent.setup>) {
    menu.shoppingList.mockResolvedValue(items);
    renderWithIntl(<MenuPage />);
    await screen.findByTestId('week-range');
    await user.click(screen.getByRole('button', { name: 'Shopping list' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('Mon, Oct 12');
    await user.click(within(dialog).getByLabelText('Mon, Oct 12'));
    await user.click(within(dialog).getByLabelText('Tue, Oct 13'));
    expect(within(dialog).getByText('2 days selected')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Build the list' }));
    await within(dialog).findByTestId('shopping-items');
    return dialog;
  }

  it('builds the list for the chosen days', async () => {
    const user = userEvent.setup();
    const dialog = await openAndGenerate(user);
    expect(menu.shoppingList).toHaveBeenCalledWith(['2026-10-12', '2026-10-13']);
    expect(within(dialog).getByText('Shopping list · Mon, Oct 12 – Tue, Oct 13')).toBeInTheDocument();
    expect(within(dialog).getByText('Tomatoes — 333 g')).toBeInTheDocument();
  });

  it('copies the list to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const dialog = await openAndGenerate(user);
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Shopping list · Mon, Oct 12 – Tue, Oct 13\n\n• Pasta — 500 g\n• Tomatoes — 333 g');
    expect(within(dialog).getByRole('status')).toHaveTextContent('Copied');
  });

  it('exports as PDF through the print dialog', async () => {
    const user = userEvent.setup();
    const win = { document: { open: vi.fn(), write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(win as unknown as Window);
    const dialog = await openAndGenerate(user);
    await user.click(within(dialog).getByRole('button', { name: 'Export as PDF' }));
    expect(win.document.write).toHaveBeenCalledWith(expect.stringContaining('Tomatoes — 333 g'));
    expect(win.print).toHaveBeenCalled();
    open.mockRestore();
  });

  it('sends the list to Plans for the chosen day', async () => {
    tasks.create.mockResolvedValue({ id: 1, title: '', notes: '', date: '2026-10-16', done: false, source: 'food' });
    const user = userEvent.setup();
    const dialog = await openAndGenerate(user);
    const date = within(dialog).getByLabelText('Day to buy it');
    expect(date).toHaveValue('2026-10-14'); // today by default
    fireEvent.change(date, { target: { value: '2026-10-16' } });
    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Add to Plans' }));
    });
    expect(tasks.create).toHaveBeenCalledWith({
      title: 'Shopping list · Mon, Oct 12 – Tue, Oct 13',
      notes: 'Pasta — 500 g\nTomatoes — 333 g',
      date: '2026-10-16',
      source: 'food',
    });
    expect(within(dialog).getByRole('status')).toHaveTextContent('Added to Plans for Fri, Oct 16.');
  });
});
