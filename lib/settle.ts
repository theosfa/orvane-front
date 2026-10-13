import type { FinanceCategory, Scope, Task, TaskSource } from './api';

// Settling a Plans task in Finance: the entry form opens prefilled from the task,
// the user only types the amount, and saving marks the task done.
// scope: a family task is settled in the family budget
export type SettlePreset = { taskId: number; title: string; source: TaskSource; scope: Scope };

export function settleHref(task: Pick<Task, 'id' | 'title' | 'source'>, scope: Scope = 'personal'): string {
  const params = new URLSearchParams({ task: String(task.id), title: task.title, source: task.source });
  if (scope === 'family') params.set('scope', 'family');
  return `/finance/spending?${params}`;
}

export function parseSettle(params: URLSearchParams): SettlePreset | null {
  const taskId = Number(params.get('task'));
  if (!Number.isInteger(taskId) || taskId <= 0) return null;
  const source = params.get('source');
  return {
    taskId,
    title: params.get('title') ?? '',
    source: source === 'food' || source === 'finance' ? source : 'manual',
    scope: params.get('scope') === 'family' ? 'family' : 'personal',
  };
}

// the category that fits where the task came from: a shopping list from Food -> groceries
export function settleCategory(preset: SettlePreset, categories: FinanceCategory[]): number | null {
  if (preset.source !== 'food') return null;
  return categories.find((c) => c.type === 'expense' && c.key === 'groceries')?.id ?? null;
}
