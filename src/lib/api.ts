/**
 * API client for the .NET ClassroomClone backend.
 * Uses VITE_API_URL (default http://localhost:5081) and sends JWT from localStorage.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5081').replace(/\/$/, '');
const TOKEN_KEY = 'classroom_token';

export function getApiUrl(): string {
  return API_URL;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  message?: string;
  status: number;
}

async function ensureOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (typeof body === 'string') message = body;
    } catch {
      try {
        message = await res.text() || message;
      } catch {
        // keep default
      }
    }
    const err = new Error(message) as Error & ApiError;
    err.status = res.status;
    throw err;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...fetchOptions, headers });
  await ensureOk(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, skipAuth = false): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', skipAuth });
}

export async function apiPost<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, skipAuth });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}
