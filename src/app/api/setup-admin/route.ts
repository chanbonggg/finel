// src/app/api/setup-admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // 1. 이미 관리자가 있는지 확인
        const existingAdmin = await prisma.admin.findFirst();
        if (existingAdmin) {
            return NextResponse.json({ message: '이미 관리자 계정이 존재합니다.' });
        }

        // 2. 비밀번호 암호화 (1234 -> $2b$10$...)
        const hashedPassword = await bcrypt.hash('rlacksdud1!', 10);

        // 3. DB에 저장
        await prisma.admin.create({
            data: {
                username: 'admin',
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            success: true,
            message: '관리자 계정(admin / 1234)이 성공적으로 생성되었습니다!'
        });

    } catch (error) {
        return NextResponse.json({ error: '생성 실패' }, { status: 500 });
    }
}