import { ApiError } from './client';

const browserDebugEnabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

function hasCsrfCookie(): boolean | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('XSRF-TOKEN='));
}

export function logAuthDebug(event: string, details: Record<string, unknown> = {}): void {
  if (!browserDebugEnabled) return;
  console.info('[finel:auth]', {
    event,
    csrfCookiePresent: hasCsrfCookie(),
    ...details,
  });
}

export function logAuthError(event: string, error: unknown): void {
  if (!browserDebugEnabled) return;
  if (error instanceof ApiError) {
    logAuthDebug(event, {
      status: error.status,
      errorCode: error.errorCode,
      stage: error.stage,
      message: error.message,
    });
    return;
  }
  logAuthDebug(event, {
    errorType: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
  });
}
