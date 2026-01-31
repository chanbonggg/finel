import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE: 특정 ID의 문의 내역 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
