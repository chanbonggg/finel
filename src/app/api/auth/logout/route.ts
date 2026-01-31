// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

// POST 함수: 로그아웃도 상태를 변경하는 것이므로 POST 방식을 사용합니다.
export async function POST() {
    try {
        // 1. 응답 객체 생성
        // 로그아웃 성공 메시지를 담은 기본 응답을 만듭니다.
        const response = NextResponse.json({
            success: true,
            message: '로그아웃 되었습니다.',
        });

        // 2. 쿠키 삭제 (핵심)
        // 'auth_token'이라는 이름의 쿠키를 즉시 만료시킵니다.
        // 브라우저는 이 응답을 받으면 저장하고 있던 쿠키를 지워버립니다.
        response.cookies.delete('auth_token');

        // 3. 응답 반환
        return response;

    } catch (error) {
        console.error('로그아웃 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}