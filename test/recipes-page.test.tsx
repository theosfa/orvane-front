import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { recipesApi, RecipeListItem } from '@/lib/api';
import RecipesPage from '@/app/recipes/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, recipesApi: { list: vi.fn(), usedIngredients: vi.fn() } };
});

const item = (id: number, name: string, author: RecipeListItem['author']): RecipeListItem => ({
  id, name, author, isPublic: true, isMine: false, autoTranslated: false, liked: false, servings: 1, calories: 400,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recipesApi.usedIngredients).mockResolvedValue([]);
  vi.mocked(recipesApi.list).mockResolvedValue([
    item(1, 'Plov', { username: 'ivan', name: 'Ivan Petrov', followed: true }),
    item(2, 'Borscht', { username: 'olga', name: null, followed: false }),
    item(3, 'Orphan stew', null),
  ]);
});

describe('recipes list', () => {
  it('shows each recipe’s author, linking to their page', async () => {
    renderWithIntl(<RecipesPage />);
    expect(await screen.findByText('Plov')).toBeInTheDocument();
    const authors = screen.getAllByTestId('author-link');
    expect(authors.map((a) => a.textContent)).toEqual(['Ivan Petrov', '@olga']);
    expect(authors[0]).toHaveAttribute('href', '/u/ivan');
  });

  it('filters to the authors I follow', async () => {
    const u = userEvent.setup();
    renderWithIntl(<RecipesPage />);
    await screen.findByText('Plov');
    await u.click(screen.getByRole('button', { name: 'Following' }));
    expect(screen.getByText('Plov')).toBeInTheDocument();
    expect(screen.queryByText('Borscht')).toBeNull();
    expect(screen.queryByText('Orphan stew')).toBeNull();
  });
});
