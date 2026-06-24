const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiConfigurationError extends Error {
  constructor() {
    super('SERVER_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required for server-side API requests.');
    this.name = 'ApiConfigurationError';
  }
}

export function isApiConfigurationError(error: unknown): error is ApiConfigurationError {
  return error instanceof ApiConfigurationError;
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const serverApiBaseUrl = process.env.SERVER_API_BASE_URL ?? browserApiBaseUrl;
    if (!serverApiBaseUrl) throw new ApiConfigurationError();
    return serverApiBaseUrl;
  }
  return browserApiBaseUrl;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBaseUrl()}${path}`, { ...init, headers, credentials: 'include' });
}

export async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json() as T;
  if (!response.ok) throw Object.assign(new Error((data as { message?: string }).message ?? 'API 요청에 실패했습니다.'), { response, data });
  return data;
}
