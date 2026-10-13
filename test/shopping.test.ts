import { describe, expect, it, vi } from 'vitest';
import { printShoppingList, shoppingLines, shoppingPrintHtml, shoppingText } from '@/lib/shopping';

const items = [
  { ingredientId: 1, name: 'Rice', amount: 1000 },
  { ingredientId: 2, name: 'Salt', amount: 4.56 },
];
const grams = (v: number) => `${v} g`;

describe('shopping list output', () => {
  it('formats one line per product with rounded grams', () => {
    expect(shoppingLines(items, grams)).toEqual(['Rice — 1000 g', 'Salt — 4.6 g']);
  });

  it('builds clipboard text with a title', () => {
    expect(shoppingText('Shopping list', ['Rice — 1000 g'])).toBe('Shopping list\n\n• Rice — 1000 g');
  });

  it('escapes product names in the printable page', () => {
    const html = shoppingPrintHtml('List <1>', ['Fish & chips — 200 g'], 'en');
    expect(html).toContain('<title>List &lt;1&gt;</title>');
    expect(html).toContain('<li>Fish &amp; chips — 200 g</li>');
  });

  it('prints through a new window, and reports a blocked popup', () => {
    const doc = { open: vi.fn(), write: vi.fn(), close: vi.fn() };
    const win = { document: doc, focus: vi.fn(), print: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValueOnce(win as unknown as Window);
    expect(printShoppingList('List', ['Rice — 1 g'], 'en')).toBe(true);
    expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('Rice — 1 g'));
    expect(win.print).toHaveBeenCalled();

    open.mockReturnValueOnce(null);
    expect(printShoppingList('List', [], 'en')).toBe(false);
    open.mockRestore();
  });
});
