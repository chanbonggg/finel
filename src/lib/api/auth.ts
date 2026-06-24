import { apiFetch, readJson } from './client';

let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const data = await readJson<{ token: string }>(await apiFetch('/api/auth/csrf', { cache: 'no-store' }));
  csrfToken = data.token;
  return csrfToken;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (!['POST', 'PATCH', 'DELETE'].includes(method)) return apiFetch(path, init);
  const headers = new Headers(init.headers);
  headers.set('X-XSRF-TOKEN', await getCsrfToken());
  const response = await apiFetch(path, { ...init, headers });
  if (response.status === 403) csrfToken = null;
  return response;
}

export async function login(username: string, password: string) {
  const response = await authenticatedFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  const data = await response.json();
  if (response.ok) csrfToken = null;
  return { response, data };
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { cache: 'no-store' });
  csrfToken = null;
}
