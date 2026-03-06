// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireAdmin, isAdminPayload } from '@/lib/admin-auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 페이지 보호 (로그인 페이지는 제외)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('auth_token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('auth_token');
      return res;
    }
  }

  // `/api/inquiries` 경로는 모든 HTTP 메소드에 대해 관리자 인증을 요구합니다.
  // 단, 고객이 직접 문의를 남기는 POST 요청은 인증이 필요 없습니다.
  if (pathname.startsWith('/api/inquiries')) {
    // 공개적인 문의 등록(POST)은 인증을 건너뜁니다.
    if (request.method === 'POST' && pathname === '/api/inquiries') {
      return NextResponse.next();
    }

    const authResult = await requireAdmin(request);
    if (!isAdminPayload(authResult)) {
      return authResult;
    }
    return NextResponse.next();
  }

  // `/api/products`, `/api/categories` 경로는 GET을 제외한 메소드만 인증을 요구합니다.
  if (pathname.startsWith('/api/products') || pathname.startsWith('/api/categories')) {
    if (request.method === 'GET') {
      return NextResponse.next();
    }

    // GET이 아닌 다른 메소드는 인증 필요
    const authResult = await requireAdmin(request);
    if (!isAdminPayload(authResult)) {
      return authResult;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// 미들웨어를 적용할 경로를 지정합니다.
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/products/:path*',
    '/api/categories/:path*',
    '/api/inquiries/:path*',
  ],
};
