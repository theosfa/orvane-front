const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lad_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('lad_token', token);
  else localStorage.removeItem('lad_token');
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header, default true
  query?: Record<string, string | number | undefined>;
};

// Core fetch wrapper. Every call to the Nest API should go through this,
// so token attachment / error shape / base URL stay in one place.
export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query } = opts;

  const url = new URL(path, API_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

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
  user?: { id: number; email: string };
};

export type Ingredient = {
  id: number;
  slug: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  fatPer100g: string;
  carbsPer100g: string;
  translations?: { lang: string; name: string }[];
};

export type RecipeStep = { stepNum: number; stepText: string };
export type RecipeIngredient = { ingredientId: number; amount: number };
export type Recipe = {
  id: number;
  name: string;
  ingredients: (RecipeIngredient & { ingredient?: Ingredient })[];
  steps: RecipeStep[];
};

export type CreateRecipeInput = {
  name: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

// ---- Endpoint helpers ----

export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: { email, password }, auth: false }),
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  profile: () => apiFetch<{ id: number; email: string; accessToken?: string }>('/auth/profile'),
};

export const recipesApi = {
  list: () => apiFetch<Recipe[]>('/recipes'),
  get: (id: number, lang = 'en') => apiFetch<Recipe>(`/recipes/${id}`, { query: { lang } }),
  create: (dto: CreateRecipeInput) => apiFetch<Recipe>('/recipes', { method: 'POST', body: dto }),
};

export const ingredientsApi = {
  list: (lang = 'en') => apiFetch<Ingredient[]>('/ingredients', { query: { lang } }),
  get: (id: number, lang = 'en') => apiFetch<Ingredient>(`/ingredients/${id}`, { query: { lang } }),
};
