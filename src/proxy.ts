// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAdminPayload } from '@/lib/admin-auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    '/api/products/:path*',
    '/api/categories/:path*',
    '/api/inquiries/:path*',
  ],
};
