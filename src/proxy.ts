// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /chanyoung 페이지 보호 (로그인 페이지는 제외)
  if (pathname.startsWith('/chanyoung') && pathname !== '/chanyoung/login') {
    try {
      const baseUrl = (process.env.SERVER_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.trim().replace(/\/+$/, '');
      if (!baseUrl) throw new Error('Spring API base URL is not configured');
      const verify = await fetch(`${baseUrl}/api/auth/verify`, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (verify.status === 200) return NextResponse.next();
      throw new Error('Authentication verification failed');
    } catch {
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
