// Every language the app ships. Adding one = add it here, add messages/<code>.json,
// and add it to SUPPORTED_LANGUAGES in orvane-back/src/common/languages.ts.
export const LANGUAGES = ['ru', 'en', 'pl', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'ru';

// shown in the language picker, each in its own language
export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  pl: 'Polski',
  fr: 'Français',
};

// the chosen language lives in this cookie so the server renders the right one straight away
export const LANGUAGE_COOKIE = 'NEXT_LOCALE';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

// first supported language from an Accept-Language header ("pl-PL,pl;q=0.9,en;q=0.8" -> 'pl')
export function matchLanguage(acceptLanguage: string | null | undefined): Language {
  const preferred = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { code: tag.split('-')[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return preferred.find((p) => isLanguage(p.code))?.code as Language | undefined ?? DEFAULT_LANGUAGE;
}
