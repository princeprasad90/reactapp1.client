import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface Tokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null; // epoch seconds
}

interface UserInfo { name: string; profileId?: string | null }

interface AuthContextValue {
  loggedIn: boolean;
  user: UserInfo | null;
  tokens: Tokens | null;
  loginWithTokens: (t: Tokens) => void;
  logout: () => void;
  setUser: (u: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth.tokens.v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);

  // derive user from access token payload if possible
  useEffect(() => {
    try {
      if (!tokens?.accessToken) return;
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1] || '')) as any;
      const name = payload?.name || payload?.preferred_username || payload?.sub || 'User';
      const profileId = payload?.profile_id ?? null;
      setUser({ name: String(name), profileId: profileId ?? null });
    } catch {
      // ignore
    }
  }, [tokens?.accessToken]);

  // load persisted tokens on boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Tokens;
        setTokens(parsed);
      }
    } catch { }
  }, []);

  // persist tokens
  useEffect(() => {
    try {
      if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { }
  }, [tokens]);

  const loginWithTokens = (t: Tokens) => setTokens(t);
  const logout = () => {
    setTokens(null);
    setUser(null);
  };

  const loggedIn = useMemo(() => !!tokens?.accessToken, [tokens]);

  return (
    <AuthContext.Provider value={{ loggedIn, user, tokens, loginWithTokens, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
