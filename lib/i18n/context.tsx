'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { setApiLanguage } from '../api';
import { LANGUAGE_COOKIE, Language } from './languages';

// Every API call carries ?lang=<current language>. Set during render (not in an effect)
// so the children's first requests already use it.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  setApiLanguage(useLocale());
  return <>{children}</>;
}

export function useT() {
  const t = useTranslations();
  const lang = useLocale();
  const format = useFormatter();
  const router = useRouter();

  // save the choice in the cookie and re-render the server part with the new messages
  const setLang = useCallback(
    (next: Language) => {
      document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      setApiLanguage(next);
      router.refresh();
    },
    [router],
  );

  // arrays/objects from the messages (mock seed data)
  const list = useCallback(<T,>(key: Parameters<typeof t.raw>[0]) => t.raw(key) as T[], [t]);

  // amounts are kept in euros; only the formatting follows the language (€12.50 / 12,50 €)
  const money = useCallback(
    (value: number, fractionDigits = 2) =>
      format.number(value, { style: 'currency', currency: 'EUR', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }),
    [format],
  );

  // Monday-first weekday names in the current language, e.g. ['Mon', …] / ['пн', …]
  const weekdays = useCallback(
    (width: 'short' | 'long') =>
      Array.from({ length: 7 }, (_, i) => {
        const name = format.dateTime(new Date(Date.UTC(2024, 0, 1 + i)), { weekday: width, timeZone: 'UTC' }); // 2024-01-01 is a Monday
        return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
      }),
    [format, lang],
  );

  return { t, lang, setLang, list, format, money, weekdays };
}
