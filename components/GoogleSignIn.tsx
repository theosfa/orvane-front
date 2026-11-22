'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';
import { APP_HOME } from '@/lib/app-mode-context';
import { ErrorMsg } from '@/components/ui';

// the parts of Google Identity Services (https://accounts.google.com/gsi/client) we use
type GoogleId = {
  initialize: (opts: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: 'popup'; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiLoading: Promise<GoogleId> | null = null;

function loadGsi(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  gsiLoading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('GSI missing')));
    script.onerror = () => {
      gsiLoading = null; // try again next time
      reject(new Error('GSI failed to load'));
    };
    document.head.appendChild(script);
  });
  return gsiLoading;
}

// "Continue with Google" + an "or" divider above the email form. Signs in, or — on the very first
// visit — creates the account, then opens the app. Renders nothing if the server has no Client ID.
export default function GoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const { t, lang } = useT();
  const { theme } = useTheme();
  const box = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authApi
      .googleConfig()
      .then((c) => setClientId(c.clientId))
      .catch(() => setClientId(null));
  }, []);

  // the latest handler, so the button (rendered once per setup) never calls a stale one
  const onCredential = useRef<(credential: string) => void>(() => {});
  onCredential.current = (credential: string) => {
    setError(null);
    setBusy(true);
    loginWithGoogle(credential)
      .then(() => router.push(APP_HOME.food))
      .catch(() => {
        setError(t('auth.errGoogle'));
        setBusy(false);
      });
  };

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsi()
      .then((gsi) => {
        if (cancelled || !box.current) return;
        gsi.initialize({
          client_id: clientId,
          callback: (r) => (r.credential ? onCredential.current(r.credential) : setError(t('auth.errGoogle'))),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        box.current.innerHTML = '';
        gsi.renderButton(box.current, {
          type: 'standard',
          theme: theme === 'ink' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          locale: lang,
          width: Math.min(400, Math.max(200, Math.round(box.current.getBoundingClientRect().width) || 336)),
        });
      })
      .catch(() => !cancelled && setError(t('auth.errGoogleLoad')));
    return () => {
      cancelled = true;
    };
  }, [clientId, theme, lang, t]);

  if (!clientId) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="google-signin">
      <div ref={box} style={{ minHeight: 44, display: 'flex', justifyContent: 'center', opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : undefined }} />
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-2)', fontSize: 12, fontWeight: 600 }}>
        <span style={{ flex: 1, height: 1, background: 'var(--stroke-2)' }} />
        {t('auth.orEmail')}
        <span style={{ flex: 1, height: 1, background: 'var(--stroke-2)' }} />
      </div>
    </div>
  );
}
