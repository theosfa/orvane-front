'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n/context';
import { Card, Btn, GlassInput, Field, ErrorMsg } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? t('auth.errBadCredentials') : t('auth.errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '40px 0 100px' }}>
      <Card style={{ width: '100%', maxWidth: 400, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{t('auth.loginTitle')}</h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 8 }}>{t('auth.loginSub')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label={t('auth.email')}>
            <GlassInput type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <Field label={t('auth.password')}>
            <GlassInput type="password" placeholder={t('auth.passwordHint')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" minLength={6} required />
          </Field>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Btn variant="primary" type="submit" disabled={submitting} style={{ width: '100%', textAlign: 'center' }}>
            {submitting ? t('auth.loggingIn') : t('auth.submitLogin')}
          </Btn>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
          {t('auth.noAccount')} <Link href="/register" style={{ fontWeight: 700, color: 'var(--accent-deep)' }}>{t('nav.register')}</Link>
        </p>
      </Card>
    </main>
  );
}
