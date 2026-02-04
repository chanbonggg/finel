import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';

export interface AdminPayload extends JWTPayload {
    id: number;
    username: string;
}

/**
 * requireAdmin의 반환값이 성공적인 AdminPayload인지 확인하는 타입 가드입니다.
 * @param result requireAdmin의 반환값
 * @returns AdminPayload이면 true를 반환합니다.
 */
export function isAdminPayload(result: NextResponse | AdminPayload): result is AdminPayload {
    // NextResponse에는 status 프로퍼티가 있지만, 우리 페이로드에는 없습니다.
    return result !== null && typeof (result as any).status !== 'number';
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | AdminPayload> {
    const tokenCookie = request.cookies.get('auth_token');

    if (!tokenCookie) {
        return NextResponse.json({ success: false, message: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const token = tokenCookie.value;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not set');
        return NextResponse.json({ success: false, message: '서버 설정 오류' }, { status: 500 });
    }

    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify<AdminPayload>(token, secretKey);
        return payload; // 성공 시 null 대신 페이로드 반환
    } catch (err) {
        console.error('JWT verification error:', err);
        const response = NextResponse.json({ success: false, message: '유효하지 않은 토큰입니다.' }, { status: 401 });
        response.cookies.delete('auth_token'); // 유효하지 않은 토큰 쿠키 삭제
        return response;
    }
}
