// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

const proxyDebugEnabled = process.env.AUTH_DEBUG_LOGGING === 'true';

function logProxyDebug(event: string, details: Record<string, unknown> = {}) {
  if (!proxyDebugEnabled) return;
  console.info('[finel:auth-proxy]', { event, ...details });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /chanyoung 페이지 보호 (로그인 페이지는 제외)
  if (pathname.startsWith('/chanyoung') && pathname !== '/chanyoung/login') {
    try {
      const baseUrl = (process.env.SERVER_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.trim().replace(/\/+$/, '');
      const authCookiePresent = request.cookies.has('auth_token');
      if (!baseUrl) {
        logProxyDebug('verify-configuration-missing', { pathname, authCookiePresent });
        throw new Error('Spring API base URL is not configured');
      }
      logProxyDebug('verify-request-start', { pathname, authCookiePresent, apiConfigured: true });
      const verify = await fetch(`${baseUrl}/api/auth/verify`, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      logProxyDebug('verify-response', { pathname, authCookiePresent, status: verify.status });
      if (verify.status === 200) return NextResponse.next();
      throw new Error('Authentication verification failed');
    } catch (error) {
      logProxyDebug('verify-failed', {
        pathname,
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.redirect(new URL('/chanyoung/login', request.url));
    }
  }

  return NextResponse.next();
}

// 미들웨어를 적용할 경로를 지정합니다.
export const config = {
  matcher: [
    '/chanyoung',
    '/chanyoung/:path*',
  ],
};
