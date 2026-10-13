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

// calories/macros are per person; servings = how many people it's cooked for
export type MenuMeal = {
  entryId: number;
  mealType: MealType;
  recipeId: number;
  recipeName: string;
  servings: number;
  addedBy: string | null; // email — shown in the family menu
} & Totals;

export type MenuDay = {
  date: string; // YYYY-MM-DD
  meals: MenuMeal[];
  total: Totals;
};

export type WeekMenu = {
  weekStart: string; // the Monday, YYYY-MM-DD
  days: MenuDay[]; // Monday..Sunday
  weekTotal: Totals;
};

export const MAX_MENU_SERVINGS = 12;

export type MenuMealInput = {
  mealType: MealType;
  recipeId: number;
  servings: number; // 1..MAX_MENU_SERVINGS
};

export type TaskSource = 'manual' | 'food' | 'finance';

export type Task = {
  id: number;
  title: string;
  notes: string;
  date: string; // YYYY-MM-DD
  done: boolean;
  source: TaskSource; // which app created it
};

export type CreateTaskInput = { title: string; notes?: string; date: string; source?: TaskSource };

export type ShoppingListItem = {
  ingredientId: number;
  name: string;
  amount: number;
};

export type TransactionType = 'expense' | 'income';

// balance = initialBalance + income − expenses; can be negative
// family: belongs to the family budget
export type Wallet = { id: number; name: string; initialBalance: number; balance: number; family: boolean };

// key: stable id of a default category ('groceries', 'salary'…), kept when renamed; null for the user's own
export type FinanceCategory = { id: number; name: string; type: TransactionType; key: string | null };

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
  transfer: boolean; // one side of a move between wallets; not counted in summaries
  author: string | null; // who logged it (email) — shown in the family budget
};

export type TransactionInput = {
  type: TransactionType;
  walletId: number;
  categoryId: number | null;
  amount: number;
  note?: string;
  date: string;
  taskId?: number; // settling a Plans task: it's marked done together with this entry
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

// 'family': the shared data of the user's family (?scope=family); 'personal' by default
export type Scope = 'personal' | 'family';
const scopeQuery = (scope?: Scope) => (scope === 'family' ? { scope } : {});

export type FamilyRole = 'admin' | 'member'; // admin changes shared data, member only views

export type FamilyOverview = {
  family: {
    id: number;
    name: string;
    myRole: FamilyRole;
    maxMembers: number;
    members: { userId: number; email: string; role: FamilyRole; isMe: boolean }[];
    invites: { id: number; email: string }[]; // sent, not accepted yet
  } | null;
  invitations: { id: number; familyName: string; invitedBy: string }[]; // to me
};

export type TransferInput = { fromWalletId: number; toWalletId: number; amount: number; date: string; note?: string };

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

// Only liked recipes can go on the menu (the API answers 400 otherwise).
export const menuApi = {
  // the Monday..Sunday week containing `week` (any day); the current week without it
  getWeek: (week?: string, scope?: Scope) => apiFetch<WeekMenu>('/menu', { query: { week, ...scopeQuery(scope) } }),
  // replaces everything planned for that day
  setDay: (date: string, meals: MenuMealInput[], scope?: Scope) =>
    apiFetch<{ saved: number }>(`/menu/days/${date}`, { method: 'PUT', body: { meals }, query: scopeQuery(scope) }),
  removeEntry: (entryId: number, scope?: Scope) =>
    apiFetch<{ removed: boolean }>(`/menu/${entryId}`, { method: 'DELETE', query: scopeQuery(scope) }),
  // ingredients of the chosen days, scaled to the people of each meal
  shoppingList: (dates: string[], scope?: Scope) =>
    apiFetch<ShoppingListItem[]>('/menu/shopping-list', { query: { dates: dates.join(','), ...scopeQuery(scope) } }),
};

// Plans (to-dos per day); other apps send their tasks here too
export const tasksApi = {
  list: (from: string, to: string, scope?: Scope) => apiFetch<Task[]>('/tasks', { query: { from, to, ...scopeQuery(scope) } }),
  create: (dto: CreateTaskInput, scope?: Scope) => apiFetch<Task>('/tasks', { method: 'POST', body: dto, query: scopeQuery(scope) }),
  update: (id: number, dto: Partial<Pick<Task, 'title' | 'notes' | 'date' | 'done'>>, scope?: Scope) =>
    apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: dto, query: scopeQuery(scope) }),
  remove: (id: number, scope?: Scope) => apiFetch<{ removed: boolean }>(`/tasks/${id}`, { method: 'DELETE', query: scopeQuery(scope) }),
};

// every call answers with the current state, like overview()
export const familyApi = {
  overview: () => apiFetch<FamilyOverview>('/family'),
  create: (name: string) => apiFetch<FamilyOverview>('/family', { method: 'POST', body: { name } }),
  rename: (name: string) => apiFetch<FamilyOverview>('/family', { method: 'PATCH', body: { name } }),
  invite: (email: string) => apiFetch<FamilyOverview>('/family/invites', { method: 'POST', body: { email } }),
  cancelInvite: (id: number) => apiFetch<FamilyOverview>(`/family/invites/${id}`, { method: 'DELETE' }),
  accept: (invitationId: number) => apiFetch<FamilyOverview>(`/family/invitations/${invitationId}/accept`, { method: 'POST' }),
  decline: (invitationId: number) => apiFetch<FamilyOverview>(`/family/invitations/${invitationId}`, { method: 'DELETE' }),
  setRole: (userId: number, role: FamilyRole) => apiFetch<FamilyOverview>(`/family/members/${userId}`, { method: 'PATCH', body: { role } }),
  remove: (userId: number) => apiFetch<FamilyOverview>(`/family/members/${userId}`, { method: 'DELETE' }),
  leave: () => apiFetch<FamilyOverview>('/family/leave', { method: 'POST' }),
};

// The first finance call creates the default categories and a wallet in the UI language.
export const financeApi = {
  wallets: (scope?: Scope) => apiFetch<Wallet[]>('/finance/wallets', { query: scopeQuery(scope) }),
  createWallet: (dto: { name: string; initialBalance?: number }, scope?: Scope) =>
    apiFetch<Wallet>('/finance/wallets', { method: 'POST', body: dto, query: scopeQuery(scope) }),
  updateWallet: (id: number, dto: { name?: string; initialBalance?: number }, scope?: Scope) =>
    apiFetch<Wallet>(`/finance/wallets/${id}`, { method: 'PATCH', body: dto, query: scopeQuery(scope) }),
  // 409 unless the balance is exactly zero
  deleteWallet: (id: number, scope?: Scope) =>
    apiFetch<{ removed: boolean }>(`/finance/wallets/${id}`, { method: 'DELETE', query: scopeQuery(scope) }),

  categories: (scope?: Scope, type?: TransactionType) =>
    apiFetch<FinanceCategory[]>('/finance/categories', { query: { type, ...scopeQuery(scope) } }),
  createCategory: (dto: { name: string; type: TransactionType }, scope?: Scope) =>
    apiFetch<FinanceCategory>('/finance/categories', { method: 'POST', body: dto, query: scopeQuery(scope) }),
  renameCategory: (id: number, name: string, scope?: Scope) =>
    apiFetch<FinanceCategory>(`/finance/categories/${id}`, { method: 'PATCH', body: { name }, query: scopeQuery(scope) }),
  deleteCategory: (id: number, scope?: Scope) =>
    apiFetch<{ removed: boolean }>(`/finance/categories/${id}`, { method: 'DELETE', query: scopeQuery(scope) }),

  transactions: (filters: TransactionFilters = {}, scope?: Scope) =>
    apiFetch<FinanceTransaction[]>('/finance/transactions', { query: { ...filters, ...scopeQuery(scope) } }),
  createTransaction: (dto: TransactionInput, scope?: Scope) =>
    apiFetch<FinanceTransaction>('/finance/transactions', { method: 'POST', body: dto, query: scopeQuery(scope) }),
  updateTransaction: (id: number, dto: Partial<TransactionInput>, scope?: Scope) =>
    apiFetch<FinanceTransaction>(`/finance/transactions/${id}`, { method: 'PATCH', body: dto, query: scopeQuery(scope) }),
  // a transfer is undone as a whole (both wallets)
  deleteTransaction: (id: number, scope?: Scope) =>
    apiFetch<{ removed: boolean }>(`/finance/transactions/${id}`, { method: 'DELETE', query: scopeQuery(scope) }),
  // between any two wallets the user may change, e.g. personal -> family budget
  transfer: (dto: TransferInput) => apiFetch<{ transferId: string }>('/finance/transfers', { method: 'POST', body: dto }),
  summary: (filters: TransactionFilters = {}, scope?: Scope) =>
    apiFetch<FinanceSummary>('/finance/summary', { query: { ...filters, ...scopeQuery(scope) } }),
};
