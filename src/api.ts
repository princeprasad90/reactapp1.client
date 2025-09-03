import axios, { AxiosRequestConfig } from 'axios';

export async function api<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  const res = await axios({
    url,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options
  });
  return res.data as T;
}
