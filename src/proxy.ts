// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 페이지 보호 (로그인 페이지는 제외)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    try {
      const baseUrl = process.env.SERVER_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error('Spring API base URL is not configured');
      const verify = await fetch(`${baseUrl}/api/auth/verify`, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
      });
      if (verify.status === 200) return NextResponse.next();
      throw new Error('Authentication verification failed');
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('auth_token');
      return res;
    }
  }

  return NextResponse.next();
}

// 미들웨어를 적용할 경로를 지정합니다.
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};
