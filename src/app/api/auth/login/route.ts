import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '아이디와 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 1. DB에서 관리자 찾기
        const admin = await prisma.admin.findUnique({ where: { username } });
        
        // 2. 계정 존재 여부 및 비밀번호 비교 (보안을 위해 메시지 통일)
        const isMatch = admin && (await bcrypt.compare(password, admin.password));
        if (!admin || !isMatch) {
            return NextResponse.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 3. JWT 비밀키 확인
        if (!JWT_SECRET) {
            console.error('JWT_SECRET이 설정되지 않았습니다.');
            return NextResponse.json(
                { success: false, message: '서버 설정 오류' },
                { status: 500 }
            );
        }

        // 4. 토큰 발급
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '12h' } // 12시간 유효
        );

        // 5. 쿠키 설정 및 응답 (보안 강화 + 미들웨어 연동)
        const response = NextResponse.json({
            success: true,
            message: '로그인 성공',
        });

        // httpOnly 쿠키에 토큰 저장 (자바스크립트로 접근 불가 -> 보안 강화)
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 12, // 12시간
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('로그인 서버 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}