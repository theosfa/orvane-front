import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from './render';
import { aiApi, photosApi, recipesApi, ApiError, Recipe } from '@/lib/api';
import NewRecipePage from '@/app/recipes/new/page';
import RecipeDetailPage from '@/app/recipes/[id]/page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    recipesApi: { get: vi.fn(), create: vi.fn(), like: vi.fn(), unlike: vi.fn(), addPhotos: vi.fn(), removePhoto: vi.fn(), makeMainPhoto: vi.fn() },
    aiApi: { generateRecipe: vi.fn(), generateImage: vi.fn() },
    photosApi: { upload: vi.fn() },
  };
});
// jsdom can't decode images — upload the file as is
vi.mock('@/lib/image', () => ({ prepareImage: (f: File) => Promise.resolve(f) }));

const recipes = vi.mocked(recipesApi);
const ai = vi.mocked(aiApi);
const photos = vi.mocked(photosApi);

const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';
const AI = '33333333-3333-4333-8333-333333333333';

const recipe = (over: Partial<Recipe> = {}): Recipe => ({
  id: 7,
  name: 'Rice bowl',
  originalLanguage: 'en',
  autoTranslated: false,
  servings: 2,
  ingredients: [],
  steps: [],
  liked: false,
  isPublic: true,
  isMine: true,
  author: null,
  photos: [],
  total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  ...over,
});

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('new recipe photos', () => {
  it('uploads photos, lets the user pick the main one and saves them in order', async () => {
    const user = userEvent.setup();
    photos.upload.mockResolvedValueOnce({ id: P1 }).mockResolvedValueOnce({ id: P2 });
    recipes.create.mockResolvedValue(recipe());
    renderWithIntl(<NewRecipePage />);

    await user.upload(screen.getByTestId('photo-input'), [file('a.jpg'), file('b.jpg')]);
    await waitFor(() => expect(screen.getAllByTestId('photo-tile')).toHaveLength(2));
    await waitFor(() => expect(screen.getAllByTestId('photo-tile')[1].querySelector('img')).not.toBeNull());
    expect(within(screen.getAllByTestId('photo-tile')[0]).getByText('Main')).toBeInTheDocument();

    await user.click(within(screen.getAllByTestId('photo-tile')[1]).getByRole('button', { name: 'Make main photo' }));
    expect(within(screen.getAllByTestId('photo-tile')[0]).getByText('Main')).toBeInTheDocument();
    expect(screen.getAllByTestId('photo-tile')[0].querySelector('img')?.getAttribute('src')).toContain(P2);

    await user.type(screen.getByPlaceholderText(/bulgur/i), 'Soup');
    await user.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(recipes.create).toHaveBeenCalled());
    expect(recipes.create.mock.calls[0][0].photoIds).toEqual([P2, P1]);
  });

  it('creates a dish photo after an AI recipe and waits for it before saving', async () => {
    const user = userEvent.setup();
    const image = deferred<{ id: string }>();
    ai.generateRecipe.mockResolvedValue({ name: 'Chicken with rice', servings: 1, ingredients: [{ ingredientId: 5, name: 'Chicken', amount: 300 }], steps: [] });
    ai.generateImage.mockReturnValue(image.promise);
    recipes.create.mockResolvedValue(recipe());
    renderWithIntl(<NewRecipePage />);

    await user.type(screen.getByPlaceholderText(/150 g of protein|dinner/i), 'chicken dinner');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText('Creating a photo of the dish…')).toBeInTheDocument();
    expect(ai.generateImage).toHaveBeenCalledWith('Chicken with rice', ['Chicken']);
    expect(screen.getByRole('button', { name: 'Waiting for photos…' })).toBeDisabled();

    image.resolve({ id: AI });
    await user.click(await screen.findByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(recipes.create).toHaveBeenCalled());
    expect(recipes.create.mock.calls[0][0].photoIds).toEqual([AI]);
  });

  it('keeps the form usable when the AI photo fails', async () => {
    const user = userEvent.setup();
    ai.generateRecipe.mockResolvedValue({ name: 'Soup', servings: 2, ingredients: [], steps: [] });
    ai.generateImage.mockRejectedValue(new ApiError(429, null));
    renderWithIntl(<NewRecipePage />);

    await user.type(screen.getByPlaceholderText(/150 g of protein|dinner/i), 'soup');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText(/daily limit of AI photos/)).toBeInTheDocument();
    expect(screen.queryAllByTestId('photo-tile')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Save recipe' })).toBeEnabled();
  });
});

describe('recipe page photos', () => {
  it('shows the main photo and lets a visitor flip through the others', async () => {
    const user = userEvent.setup();
    recipes.get.mockResolvedValue(recipe({ isMine: false, photos: [{ id: P1 }, { id: P2 }] }));
    renderWithIntl(<RecipeDetailPage />);

    expect((await screen.findByTestId('recipe-photo')).getAttribute('src')).toContain(P1);
    expect(screen.queryByText('Dish photos')).toBeNull(); // not the author: no editing
    await user.click(screen.getAllByRole('button').find((b) => b.querySelector(`img[src*="${P2}"]`))!);
    expect(screen.getByTestId('recipe-photo').getAttribute('src')).toContain(P2);
  });

  it('lets the author add a photo and change the main one', async () => {
    const user = userEvent.setup();
    recipes.get.mockResolvedValue(recipe({ photos: [{ id: P1 }] }));
    photos.upload.mockResolvedValue({ id: P2 });
    recipes.addPhotos.mockResolvedValue([{ id: P1 }, { id: P2 }]);
    recipes.makeMainPhoto.mockResolvedValue([{ id: P2 }, { id: P1 }]);
    renderWithIntl(<RecipeDetailPage />);

    await screen.findByText('Dish photos');
    await user.upload(screen.getByTestId('photo-input'), file('new.jpg'));
    await waitFor(() => expect(recipes.addPhotos).toHaveBeenCalledWith(7, [P2]));
    await waitFor(() => expect(screen.getAllByTestId('photo-tile')).toHaveLength(2));

    await user.click(within(screen.getAllByTestId('photo-tile')[1]).getByRole('button', { name: 'Make main photo' }));
    await waitFor(() => expect(screen.getByTestId('recipe-photo').getAttribute('src')).toContain(P2));
    expect(recipes.makeMainPhoto).toHaveBeenCalledWith(7, P2);
  });
});
