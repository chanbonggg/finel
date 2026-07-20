import type { ApiErrorBody } from './types';

const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '';

export class ApiConfigurationError extends Error {
  constructor(runtime: 'browser' | 'server') {
    super(runtime === 'browser'
      ? 'NEXT_PUBLIC_API_BASE_URL is required for browser API requests.'
      : 'SERVER_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required for server API requests.');
    this.name = 'ApiConfigurationError';
  }
}

export function isApiConfigurationError(error: unknown): error is ApiConfigurationError {
  return error instanceof ApiConfigurationError;
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const serverApiBaseUrl = process.env.SERVER_API_BASE_URL?.trim() || browserApiBaseUrl;
    if (!serverApiBaseUrl) throw new ApiConfigurationError('server');
    return serverApiBaseUrl.replace(/\/+$/, '');
  }
  if (!browserApiBaseUrl) throw new ApiConfigurationError('browser');
  return browserApiBaseUrl.replace(/\/+$/, '');
}

export class ApiError<T = ApiErrorBody> extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly stage: string | null;
  readonly data: T | null;
  readonly response: Response;

  constructor(response: Response, data: T | null, message: string, errorCode: string | null, stage: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = response.status;
    this.errorCode = errorCode;
    this.stage = stage;
    this.data = data;
    this.response = response;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function normalizeApiPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBaseUrl()}${normalizeApiPath(path)}`, { ...init, headers, credentials: 'include' });
}

export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      if (response.ok) throw new ApiError(response, null, 'API 응답을 해석할 수 없습니다.', null, null);
    }
  }

  if (!response.ok) {
    const errorBody = data && typeof data === 'object' ? data as ApiErrorBody : null;
    throw new ApiError(
      response,
      data,
      errorBody?.message ?? `API 요청에 실패했습니다. (${response.status})`,
      errorBody?.errorCode ?? null,
      errorBody?.stage ?? null,
    );
  }
  if (data === null) throw new ApiError(response, null, 'API 응답 본문이 비어 있습니다.', null, null);
  if (typeof data === 'object' && (data as { success?: unknown }).success === false) {
    const errorBody = data as ApiErrorBody;
    throw new ApiError(
      response,
      data,
      errorBody.message ?? 'API가 실패 응답을 반환했습니다.',
      errorBody.errorCode ?? null,
      errorBody.stage ?? null,
    );
  }
  return data;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return readJson<T>(await apiFetch(path, init));
}
