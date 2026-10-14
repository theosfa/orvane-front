import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { recipesApi, Recipe } from '@/lib/api';
import RecipeDetailPage from '@/app/recipes/[id]/page';
import NewRecipePage from '@/app/recipes/new/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, recipesApi: { get: vi.fn(), create: vi.fn(), like: vi.fn(), unlike: vi.fn() } };
});

const api = vi.mocked(recipesApi);

const recipe: Recipe = {
  id: 7,
  name: 'Rice bowl',
  originalLanguage: 'en',
  autoTranslated: false,
  servings: 2,
  ingredients: [
    { ingredientId: 1, name: 'Rice', amount: '300.00', calories: 390, protein: 8.1, fat: 0.9, carbs: 84 },
    { ingredientId: 2, name: 'Salt', amount: '3.00', calories: 0, protein: 0, fat: 0, carbs: 0 },
  ],
  steps: [{ stepNum: 1, stepText: 'Boil.' }],
  liked: false,
  isPublic: true,
  isMine: true,
  author: null,
  total: { calories: 390, protein: 8.1, fat: 0.9, carbs: 84 },
};

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue(recipe);
});

describe('recipe detail servings', () => {
  it('starts at the author’s count and recalculates ingredients and calories', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RecipeDetailPage />);

    expect(await screen.findByText('Ingredients for 2 people')).toBeInTheDocument();
    expect(screen.getByText('The recipe is written for 2 people')).toBeInTheDocument();
    const [rice, salt] = screen.getAllByTestId('ingredient-row');
    expect(rice).toHaveTextContent('300 g');

    await user.click(screen.getByRole('button', { name: 'More people' }));
    await user.click(screen.getByRole('button', { name: 'More people' }));
    expect(screen.getByText('Ingredients for 4 people')).toBeInTheDocument();
    expect(rice).toHaveTextContent('600 g');
    expect(salt).toHaveTextContent('6 g');
    expect(screen.getByText('780 kcal')).toBeInTheDocument();
    expect(screen.getByText('195 kcal per person')).toBeInTheDocument();

    const input = screen.getByLabelText('Servings');
    await user.clear(input);
    await user.type(input, '1');
    expect(within(rice).getByText(/150 g/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fewer people' })).toBeDisabled();
  });
});

describe('new recipe servings', () => {
  it('sends the chosen number of people', async () => {
    api.create.mockResolvedValue({ ...recipe, id: 99 });
    const user = userEvent.setup();
    renderWithIntl(<NewRecipePage />);

    await user.type(screen.getByPlaceholderText('e.g. Bulgur bowl'), 'Soup');
    await user.click(screen.getByRole('button', { name: 'More people' })); // 2 -> 3
    await user.click(screen.getByRole('button', { name: 'Save recipe' }));

    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Soup', servings: 3 }));
  });
});
