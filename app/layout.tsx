import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { LanguageProvider } from '@/lib/i18n/context';
import { AppModeProvider } from '@/lib/app-mode-context';
import { FamilyProvider } from '@/lib/family-context';
import { FutureMockProvider } from '@/lib/mock/future-context';
import { Bloom } from '@/components/ui';
import Header from '@/components/Header';
import Dock from '@/components/Dock';
import Sidebar from '@/components/Sidebar';
import InviteToast from '@/components/InviteToast';
import './globals.css';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('brand.name'), description: t('meta.description') };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // picked in lib/i18n/request.ts from the language cookie or the browser's languages
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <LanguageProvider>
              <AuthProvider>
                <FamilyProvider>
                <AppModeProvider>
                  <FutureMockProvider>
                      <Bloom />
                      {/* desktop: sidebar + content; phones: content + the bottom Dock (see .app-* in globals.css) */}
                      <div className="app-shell">
                        <Sidebar />
                        <div className="app-main">
                          <Header />
                          <div className="app-content">{children}</div>
                        </div>
                      </div>
                      <Dock />
                      <InviteToast />
                  </FutureMockProvider>
                </AppModeProvider>
                </FamilyProvider>
              </AuthProvider>
            </LanguageProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
