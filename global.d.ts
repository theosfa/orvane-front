import type messages from './messages/ru.json';
import type { Language } from './lib/i18n/languages';

// Typed keys: t('food.recipse') is a compile error. ru.json is the reference file.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Language;
    Messages: typeof messages;
  }
}
