import { describe, expect, it } from 'vitest';
import { parseSettle, settleCategory, settleHref } from '@/lib/settle';

describe('settle', () => {
  it('round-trips a task through the finance link', () => {
    const href = settleHref({ id: 12, title: 'Shopping list · Mon & Tue', source: 'food' });
    expect(href.startsWith('/finance/spending?')).toBe(true);
    expect(parseSettle(new URLSearchParams(href.split('?')[1]))).toEqual({ taskId: 12, title: 'Shopping list · Mon & Tue', source: 'food' });
  });

  it('ignores links without a valid task', () => {
    expect(parseSettle(new URLSearchParams(''))).toBeNull();
    expect(parseSettle(new URLSearchParams('task=abc'))).toBeNull();
    expect(parseSettle(new URLSearchParams('task=3&source=hack'))).toEqual({ taskId: 3, title: '', source: 'manual' });
  });

  it('picks groceries for Food tasks, by key even if renamed', () => {
    const cats = [
      { id: 1, name: 'Cafe', type: 'expense' as const, key: 'cafe' },
      { id: 2, name: 'Jedzenie', type: 'expense' as const, key: 'groceries' },
    ];
    expect(settleCategory({ taskId: 1, title: '', source: 'food' }, cats)).toBe(2);
    expect(settleCategory({ taskId: 1, title: '', source: 'manual' }, cats)).toBeNull();
    expect(settleCategory({ taskId: 1, title: '', source: 'food' }, [cats[0]])).toBeNull();
  });
});
