'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setToken, ApiError } from './api';

type User = { id: number; email: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.profile();
      // your backend's /auth/profile issues a fresh token alongside the profile
      if (profile.accessToken) setToken(profile.accessToken);
      setUser({ id: profile.id, email: profile.email });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('lad_token');
    if (hasToken) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const register = async (email: string, password: string) => {
    const res = await authApi.register(email, password);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
