import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/en.json';

// renders with the real English messages so missing keys show up as test failures
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
      timeZone="Europe/Warsaw"
      onError={(err) => {
        throw err;
      }}
    >
      {ui}
    </NextIntlClientProvider>,
  );
}
