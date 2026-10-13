import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { isLanguage, matchLanguage, LANGUAGE_COOKIE } from './languages';

// Runs on the server for every request: the saved choice wins, otherwise the browser's languages.
export default getRequestConfig(async () => {
  const saved = cookies().get(LANGUAGE_COOKIE)?.value;
  const locale = isLanguage(saved) ? saved : matchLanguage(headers().get('accept-language'));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // server and browser must agree on dates; use the server's zone (same machine in dev)
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
});
