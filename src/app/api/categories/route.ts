import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;

        // Next.js 15: params는 비동기로 접근해야 합니다.
        const { id: idString } = await params;
        const id = Number(idString);

        if (isNaN(id)) {
            return NextResponse.json({ success: false, message: '잘못된 ID입니다.' }, { status: 400 });
        }

        // ⚠️ 중요: 이 카테고리를 쓰는 제품이 있는지 먼저 확인!
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productCount > 0) {
            return NextResponse.json(
                { success: false, message: `이 카테고리에 등록된 제품이 ${productCount}개 있습니다. 제품을 먼저 삭제하거나 옮겨주세요.` },
                { status: 400 }
            );
        }

        // 제품이 없으면 안전하게 삭제
        await prisma.category.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true, message: "카테고리가 삭제되었습니다." });

    } catch (error) {
        console.error("카테고리 삭제 에러:", error);
        return NextResponse.json({ success: false, message: "삭제 중 오류 발생" }, { status: 500 });
    }
}