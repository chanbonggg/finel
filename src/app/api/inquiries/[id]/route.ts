import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// DELETE: 특정 ID의 문의 내역 삭제
export async function DELETE(
    request: Request,
    // 1. [변경] params의 타입이 Promise<{ id: string }> 으로 바뀝니다.
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        // 2. [변경] params를 사용하기 전에 await로 먼저 기다려줍니다.
        const { id: idString } = await params;

        // 문자열을 숫자로 변환
        const id = Number(idString);

        // 유효성 검사
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: '잘못된 ID입니다.' },
                { status: 400 }
            );
        }

        // DB에서 삭제
        await prisma.inquiry.delete({
            where: { id: id },
        });

        return NextResponse.json({
            success: true,
            message: '문의 내역이 삭제되었습니다.',
        });

    } catch (error) {
        console.error('문의 삭제 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
