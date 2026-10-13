import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@/lib/i18n/languages';
import en from '@/messages/en.json';

function keys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('messages', () => {
  const reference = keys(en).sort();
  it.each(LANGUAGES.filter((l) => l !== 'en'))('%s has exactly the same keys as en', async (lang) => {
    const messages = (await import(`@/messages/${lang}.json`)).default;
    expect(keys(messages).sort()).toEqual(reference);
  });
});
