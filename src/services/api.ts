import React from 'react';
import { useAuth } from '../store/auth';

// Env-configurable endpoints
const LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL || '/api/auth/login-redirect';
const REFRESH_URL = import.meta.env.VITE_AUTH_REFRESH_URL || '/api/auth/refresh';
const LOGOUT_URL = import.meta.env.VITE_AUTH_LOGOUT_URL || '/api/auth/logout';

export const authEndpoints = { LOGIN_URL, REFRESH_URL, LOGOUT_URL };

// Lightweight event bus for non-React callers
type Listener = () => void;
const listeners = new Set<Listener>();
export const onAuthChange = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };
export const notifyAuthChange = () => listeners.forEach(l => l());

// Shared token holder to avoid prop-drilling in non-React code
let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;

export const setTokenCache = (accessToken: string | null, refreshToken?: string | null) => {
  accessTokenCache = accessToken;
  refreshTokenCache = refreshToken ?? null;
  notifyAuthChange();
};

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const attachAuth = (opts: RequestInit) => {
    const headers = new Headers(opts.headers || {});
    if (accessTokenCache) headers.set('Authorization', `Bearer ${accessTokenCache}`);
    return { ...opts, headers };
  };

  let res = await fetch(input, attachAuth(init));
  if (res.status !== 401) return res;

  // Try refresh
  if (!refreshTokenCache) return res;
  const refreshRes = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenCache }),
    credentials: 'include'
  });
  if (!refreshRes.ok) return res;
  const refreshed = await refreshRes.json().catch(() => ({}));
  if (refreshed?.accessToken) {
    setTokenCache(refreshed.accessToken, refreshed.refreshToken ?? refreshTokenCache);
    // retry once
    res = await fetch(input, attachAuth(init));
  }
  return res;
}

// Hook to wire cache to context
export function useWireTokens() {
  const { tokens } = useAuth();
  React.useEffect(() => {
    setTokenCache(tokens?.accessToken ?? null, tokens?.refreshToken ?? null);
  }, [tokens?.accessToken, tokens?.refreshToken]);
}
