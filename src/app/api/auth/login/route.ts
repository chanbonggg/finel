import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// .env 파일에서 비밀번호와 암호화 키를 가져옵니다.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // ✅ [변경] username은 받지 않고, password만 꺼냅니다.
        const { password } = body;

        // 1. 비밀번호 검사
        // 사용자가 입력한 비번이 .env에 적어둔 비번과 다르면 에러!
        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { success: false, message: '비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 2. JWT 비밀키 확인
        if (!JWT_SECRET) {
            console.error('JWT_SECRET이 설정되지 않았습니다.');
            return NextResponse.json(
                { success: false, message: '서버 설정 오류' },
                { status: 500 }
            );
        }

        // 3. 토큰 발급 (내용물은 role: 'admin' 정도만 넣으면 됩니다)
        const token = jwt.sign(
            { role: 'admin' },
            JWT_SECRET,
            { expiresIn: '12h' } // 12시간 유효
        );

        // 4. 성공 응답 (토큰을 프론트엔드에 전달)
        // 프론트엔드에서 이 토큰을 받아서 localStorage에 저장합니다.
        return NextResponse.json({
            success: true,
            message: '로그인 성공',
            token,
        });

    } catch (error) {
        console.error('로그인 서버 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}