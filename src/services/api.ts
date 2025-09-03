import React from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
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

export async function apiFetch(url: string, init: AxiosRequestConfig = {}): Promise<AxiosResponse> {
  const attachAuth = (cfg: AxiosRequestConfig) => {
    const headers = { ...(cfg.headers || {}) } as Record<string, string>;
    if (accessTokenCache) headers['Authorization'] = `Bearer ${accessTokenCache}`;
    return {
      withCredentials: true,
      validateStatus: () => true,
      ...cfg,
      headers
    };
  };

  let res = await axios({ url, ...attachAuth(init) });
  if (res.status !== 401) return res;

  // Try refresh
  if (!refreshTokenCache) return res;
  const refreshRes = await axios.post(REFRESH_URL, { refreshToken: refreshTokenCache }, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    validateStatus: () => true
  });
  if (refreshRes.status < 200 || refreshRes.status >= 300) return res;
  const refreshed = refreshRes.data || {};
  if (refreshed?.accessToken) {
    setTokenCache(refreshed.accessToken, refreshed.refreshToken ?? refreshTokenCache);
    // retry once
    res = await axios({ url, ...attachAuth(init) });
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
