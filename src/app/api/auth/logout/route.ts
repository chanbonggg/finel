import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const response = NextResponse.json({ success: true, message: "Logged out" });
        
        // 'auth_token' 쿠키를 삭제합니다.
        response.cookies.set('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            expires: new Date(0), // 쿠키를 즉시 만료시킴
        });

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ success: false, message: 'Server error during logout' }, { status: 500 });
    }
}
