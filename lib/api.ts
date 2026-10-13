import type { Language } from './i18n/languages';

// Without NEXT_PUBLIC_API_URL the browser calls the API on the same origin under /api, and Next
// proxies it to port 3001 (see next.config.js). So only port 3000 has to be reachable: LAN,
// a tunnel or a public domain all work without extra setup.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001');

// new URL('/auth/x', base) would drop the base's path (/api), so join by hand
function apiUrl(path: string) {
  return new URL(API_URL.replace(/\/$/, '') + path);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Short-lived access token (15 min) lives only in memory. The long-lived refresh
// token is an httpOnly cookie set by the API, so JS never sees it; after a reload
// the access token is recovered with refreshAccessToken().
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

// Current UI language, added as ?lang= to every request so the API answers in it
// (recipe/ingredient names, steps). Kept in sync by LanguageProvider.
let apiLanguage = 'en';

export function setApiLanguage(language: string) {
  apiLanguage = language;
}

// one in-flight refresh shared by all requests that hit 401 at the same time
let refreshing: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= fetch(apiUrl('/auth/refresh').toString(), { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        setToken(null);
        return false;
      }
      const data = (await res.json()) as AuthResponse;
      setToken(data.accessToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header, default true
  query?: Record<string, string | number | undefined>;
};

// Core fetch wrapper. Every call to the Nest API should go through this,
// so token attachment / error shape / base URL stay in one place.
export async function apiFetch<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', body, auth = true, query } = opts;

  const url = apiUrl(path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  if (!url.searchParams.has('lang')) url.searchParams.set('lang', apiLanguage);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'include', // send the refresh cookie to /auth/*
  });

  // access token expired — swap the refresh cookie for a new one and retry once
  if (res.status === 401 && auth && !retried && (await refreshAccessToken())) {
    return apiFetch<T>(path, opts, true);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data, data?.message ?? res.statusText);
  }

  return data as T;
}

// ---- Typed shapes matching your Nest DTOs / entities ----

export type AuthResponse = {
  accessToken: string;
};

// GET /auth/profile: { user: { id, email, createdAt, language } }
export type ProfileResponse = {
  user: { id: number; email: string; createdAt: string; language: string };
};

export type Ingredient = {
  id: number;
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  fatPer100g: string;
  carbsPer100g: string;
};

export type RecipeStep = { stepNum: number; stepText: string };

export type Totals = { calories: number; protein: number; fat: number; carbs: number };

// GET /recipes and GET /recipes/liked: { id, name, liked } per item, no ingredients/steps
// isPublic = false: private, only its author sees it; isMine: the current user wrote it
// autoTranslated: the name was machine-translated from the author's language
// servings: how many people the ingredient amounts are for
export type RecipeListItem = { id: number; name: string; autoTranslated: boolean; liked: boolean; isPublic: boolean; isMine: boolean; servings: number; calories: number };

export type RecipeFilters = { q?: string; minCalories?: number; maxCalories?: number; ingredientIds?: number[] };

// GET /recipes/:id and POST /recipes: full detail with computed CPF
export type RecipeIngredientDetail = {
  ingredientId: number;
  name: string;
  amount: string; // raw decimal column, e.g. "100.00"
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type Recipe = {
  id: number;
  name: string;
  originalLanguage: Language; // the language the author wrote it in
  autoTranslated: boolean; // name or steps were machine-translated into the requested language
  servings: number; // ingredient amounts and total are for this many people
  ingredients: RecipeIngredientDetail[];
  steps: RecipeStep[];
  liked: boolean;
  isPublic: boolean;
  isMine: boolean;
  total: Totals;
};

export type RecipeIngredientInput = { ingredientId: number; amount: number };

export type CreateRecipeInput = {
  name: string;
  isPublic: boolean;
  servings: number;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStep[];
};

// ingredientId = null: the AI suggested something that isn't in the DB yet
export type GeneratedRecipe = {
  name: string;
  servings: number;
  ingredients: { ingredientId: number | null; name: string; amount: number }[];
  steps: RecipeStep[];
};

export type CreateIngredientInput = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MenuMeal = {
  entryId: number;
  mealType: MealType;
  recipeId: number;
  recipeName: string;
} & Totals;

export type MenuDay = {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  meals: MenuMeal[];
  total: Totals;
};

export type WeekMenu = {
  days: MenuDay[];
  weekTotal: Totals;
};

export type AddMenuEntryInput = {
  dayOfWeek: number;
  mealType: MealType;
  recipeId: number;
};

export type ShoppingListItem = {
  ingredientId: number;
  name: string;
  amount: number;
};

export type TransactionType = 'expense' | 'income';

// balance = initialBalance + income − expenses; can be negative
export type Wallet = { id: number; name: string; initialBalance: number; balance: number };

export type FinanceCategory = { id: number; name: string; type: TransactionType };

export type FinanceTransaction = {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
  walletId: number;
  walletName: string | null;
  categoryId: number | null; // null: no category (or it was deleted)
  categoryName: string | null;
};

export type TransactionInput = {
  type: TransactionType;
  walletId: number;
  categoryId: number | null;
  amount: number;
  note?: string;
  date: string;
};

// categoryId 'none': only operations without a category
export type TransactionFilters = {
  type?: TransactionType;
  walletId?: number;
  categoryId?: number | 'none';
  from?: string;
  to?: string;
};

export type FinanceSummary = {
  income: number;
  expense: number;
  net: number;
  byCategory: { type: TransactionType; categoryId: number | null; name: string | null; total: number; count: number }[];
};

// ---- Endpoint helpers ----

// Endpoints below get ?lang=<UI language> automatically (see apiFetch).

export const authApi = {
  register: (email: string, password: string, language?: Language) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: { email, password, language }, auth: false }),
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST', auth: false }),
  profile: () => apiFetch<ProfileResponse>('/auth/profile'),
  updateProfile: (data: { language: Language }) => apiFetch<ProfileResponse>('/auth/profile', { method: 'PATCH', body: data }),
};

export const recipesApi = {
  list: ({ ingredientIds, ...filters }: RecipeFilters = {}) =>
    apiFetch<RecipeListItem[]>('/recipes', { query: { ...filters, ingredientIds: ingredientIds?.length ? ingredientIds.join(',') : undefined } }),
  // ingredients used in recipes the user can see — options for the ingredient filter
  usedIngredients: () => apiFetch<{ id: number; name: string }[]>('/recipes/ingredients'),
  // lang: another language than the UI's, e.g. the original to show an untranslated recipe
  get: (id: number, lang?: Language) => apiFetch<Recipe>(`/recipes/${id}`, { query: { lang } }),
  // random public recipes in full, skipping the ids already shown (the reels-style feed)
  feed: (exclude: number[], limit = 5) =>
    apiFetch<Recipe[]>('/recipes/feed', { query: { exclude: exclude.length ? exclude.join(',') : undefined, limit } }),
  create: (dto: CreateRecipeInput) => apiFetch<Recipe>('/recipes', { method: 'POST', body: dto }),
  liked: () => apiFetch<RecipeListItem[]>('/recipes/liked'),
  like: (id: number) => apiFetch<{ liked: boolean }>(`/recipes/${id}/like`, { method: 'POST' }),
  unlike: (id: number) => apiFetch<{ liked: boolean }>(`/recipes/${id}/like`, { method: 'DELETE' }),
};

export const aiApi = {
  // lang: the language the recipe should be written in
  generateRecipe: (prompt: string, lang: Language) =>
    apiFetch<GeneratedRecipe>('/ai/recipes/generate', { method: 'POST', body: { prompt, lang } }),
};

export const ingredientsApi = {
  list: () => apiFetch<Ingredient[]>('/ingredients'),
  get: (id: number) => apiFetch<Ingredient>(`/ingredients/${id}`),
  search: (q: string) => apiFetch<Ingredient[]>('/ingredients/search', { query: { q } }),
  create: (dto: CreateIngredientInput) => apiFetch<Ingredient>('/ingredients', { method: 'POST', body: dto }),
};

export const menuApi = {
  getWeek: () => apiFetch<WeekMenu>('/menu'),
  addEntry: (dto: AddMenuEntryInput) => apiFetch<{ id: number }>('/menu', { method: 'POST', body: dto }),
  removeEntry: (entryId: number) => apiFetch<{ removed: boolean }>(`/menu/${entryId}`, { method: 'DELETE' }),
  shoppingList: () => apiFetch<ShoppingListItem[]>('/menu/shopping-list'),
};

// The first finance call creates the default categories and a wallet in the UI language.
export const financeApi = {
  wallets: () => apiFetch<Wallet[]>('/finance/wallets'),
  createWallet: (dto: { name: string; initialBalance?: number }) => apiFetch<Wallet>('/finance/wallets', { method: 'POST', body: dto }),
  updateWallet: (id: number, dto: { name?: string; initialBalance?: number }) =>
    apiFetch<Wallet>(`/finance/wallets/${id}`, { method: 'PATCH', body: dto }),
  // 409 unless the balance is exactly zero
  deleteWallet: (id: number) => apiFetch<{ removed: boolean }>(`/finance/wallets/${id}`, { method: 'DELETE' }),

  categories: (type?: TransactionType) => apiFetch<FinanceCategory[]>('/finance/categories', { query: { type } }),
  createCategory: (dto: { name: string; type: TransactionType }) =>
    apiFetch<FinanceCategory>('/finance/categories', { method: 'POST', body: dto }),
  renameCategory: (id: number, name: string) =>
    apiFetch<FinanceCategory>(`/finance/categories/${id}`, { method: 'PATCH', body: { name } }),
  deleteCategory: (id: number) => apiFetch<{ removed: boolean }>(`/finance/categories/${id}`, { method: 'DELETE' }),

  transactions: (filters: TransactionFilters = {}) => apiFetch<FinanceTransaction[]>('/finance/transactions', { query: filters }),
  createTransaction: (dto: TransactionInput) => apiFetch<FinanceTransaction>('/finance/transactions', { method: 'POST', body: dto }),
  updateTransaction: (id: number, dto: Partial<TransactionInput>) =>
    apiFetch<FinanceTransaction>(`/finance/transactions/${id}`, { method: 'PATCH', body: dto }),
  deleteTransaction: (id: number) => apiFetch<{ removed: boolean }>(`/finance/transactions/${id}`, { method: 'DELETE' }),
  summary: (filters: TransactionFilters = {}) => apiFetch<FinanceSummary>('/finance/summary', { query: filters }),
};
