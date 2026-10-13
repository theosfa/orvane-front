import type { ShoppingListItem } from './api';
import { roundGrams } from './servings';

// "Rice — 1000 g" per item; grams formats the number in the UI language
export function shoppingLines(items: ShoppingListItem[], grams: (value: number) => string): string[] {
  return items.map((i) => `${i.name} — ${grams(roundGrams(i.amount))}`);
}

// plain text for the clipboard and for the task sent to Plans
export function shoppingText(title: string, lines: string[]): string {
  return [title, '', ...lines.map((l) => `• ${l}`)].join('\n');
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// standalone printable page; the browser's print dialog saves it as a PDF
export function shoppingPrintHtml(title: string, lines: string[], lang: string): string {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 18px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { display: flex; gap: 12px; align-items: center; padding: 9px 0; border-bottom: 1px solid #ddd; font-size: 15px; }
  li::before { content: ''; width: 14px; height: 14px; border: 1.5px solid #555; border-radius: 3px; flex: none; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<ul>
${lines.map((l) => `  <li>${escapeHtml(l)}</li>`).join('\n')}
</ul>
</body>
</html>`;
}

// opens the printable list in a new window and starts printing (choose "Save as PDF");
// false when the browser blocked the popup
export function printShoppingList(title: string, lines: string[], lang: string): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(shoppingPrintHtml(title, lines, lang));
  win.document.close();
  win.focus();
  win.print();
  return true;
}
