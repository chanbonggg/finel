import { apiFetch, ApiError, apiRequest, readJson } from './client';
import { logAuthDebug, logAuthError } from './auth-debug';
import type { CsrfResponse, LoginResponse, MessageResponse, VerifyResponse } from './types';

let csrfToken: string | null = null;
let csrfHeaderName = 'X-XSRF-TOKEN';

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    logAuthDebug('csrf-cache-hit');
    return csrfToken;
  }
  logAuthDebug('csrf-request-start');
  try {
    const data = await apiRequest<CsrfResponse>('/api/auth/csrf', { cache: 'no-store' });
    if (!data.success || !data.token || data.headerName.toUpperCase() !== 'X-XSRF-TOKEN') {
      throw new Error('CSRF 토큰 응답 계약이 올바르지 않습니다.');
    }
    csrfToken = data.token;
    csrfHeaderName = data.headerName;
    logAuthDebug('csrf-request-success', { headerName: csrfHeaderName });
    return csrfToken;
  } catch (error) {
    logAuthError('csrf-request-failed', error);
    throw error;
  }
}

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (!['POST', 'PATCH', 'DELETE'].includes(method)) return apiFetch(path, init);
  const headers = new Headers(init.headers);
  headers.set(csrfHeaderName, await getCsrfToken());
  logAuthDebug('state-change-request-start', { method, path, csrfHeaderName });
  const response = await apiFetch(path, { ...init, headers });
  logAuthDebug('state-change-response', { method, path, status: response.status });
  if (response.status === 403) {
    try {
      await readJson(response.clone());
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'CSRF_INVALID') {
        csrfToken = null;
        logAuthDebug('csrf-token-cleared-after-rejection', { method, path });
      }
    }
  }
  return response;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  logAuthDebug('login-start', { usernamePresent: Boolean(username), passwordPresent: Boolean(password) });
  try {
    const response = await authenticatedFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    const data = await readJson<LoginResponse>(response);
    csrfToken = null;
    logAuthDebug('login-success');
    return data;
  } catch (error) {
    logAuthError('login-failed', error);
    throw error;
  }
}

export async function logout(): Promise<MessageResponse> {
  const data = await apiRequest<MessageResponse>('/api/auth/logout', { cache: 'no-store' });
  csrfToken = null;
  return data;
}

export async function verify(): Promise<VerifyResponse> {
  return apiRequest<VerifyResponse>('/api/auth/verify', { cache: 'no-store' });
}
