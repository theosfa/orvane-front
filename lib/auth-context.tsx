'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authApi, setToken, refreshAccessToken, ApiError, ProfileResponse } from './api';
import { useT } from './i18n/context';
import { Language, isLanguage, DEFAULT_LANGUAGE } from './i18n/languages';

type User = { id: number; email: string; createdAt: string; language: Language } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // saves the interface language to the user's profile and switches the app to it
  updateLanguage: (language: Language) => Promise<void>;
};

const toLanguage = (value: string): Language => (isLanguage(value) ? value : DEFAULT_LANGUAGE);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const { lang, setLang } = useT();
  const langRef = useRef(lang);
  langRef.current = lang;

  // the profile's language wins over whatever the browser had stored;
  // switching reloads the messages from the server, so only do it when it differs
  const applyProfile = useCallback(
    (profile: ProfileResponse) => {
      const language = toLanguage(profile.user.language);
      setUser({ id: profile.user.id, email: profile.user.email, createdAt: profile.user.createdAt, language });
      if (language !== langRef.current) {
        langRef.current = language;
        setLang(language);
      }
    },
    [setLang],
  );

  const refreshProfile = useCallback(async () => {
    try {
      applyProfile(await authApi.profile());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    // tokens from the old localStorage-only scheme are no longer used
    localStorage.removeItem('lad_token');
    // no access token after a reload — the refresh cookie (if any) gets us a new one
    refreshAccessToken().then((ok) => (ok ? refreshProfile() : setLoading(false)));
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const register = async (email: string, password: string) => {
    const res = await authApi.register(email, password, lang);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const logout = () => {
    authApi.logout().catch(() => {}); // revoke the refresh token + clear its cookie
    setToken(null);
    setUser(null);
  };

  const updateLanguage = async (language: Language) => {
    langRef.current = language;
    setLang(language); // switch immediately, persist in the background
    applyProfile(await authApi.updateProfile({ language }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
