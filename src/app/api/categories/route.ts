// src/app/api/categories/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// 1. 카테고리 목록 조회 (GET)
// 화면의 <select> 박스에 보여줄 목록을 가져옵니다.
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }, // 이름 가나다순 정렬
        });
        return NextResponse.json({ success: true, categories });
    } catch (error) {
        return NextResponse.json({ success: false, error: '카테고리 로딩 실패' }, { status: 500 });
    }
}

// 2. 카테고리 추가 (POST)
// [+ 카테고리 추가] 버튼을 눌렀을 때 실행됩니다.
export async function POST(request: Request) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;

        const { name } = await request.json();

        // 중복 체크 (이미 있는 이름인지?)
        const existing = await prisma.category.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ success: false, message: '이미 존재하는 카테고리입니다.' }, { status: 400 });
        }

        // DB에 저장
        const newCategory = await prisma.category.create({
            data: { name }
        });

        return NextResponse.json({ success: true, category: newCategory });
    } catch (error) {
        return NextResponse.json({ success: false, error: '카테고리 추가 실패' }, { status: 500 });
    }

}
// 3. 카테고리 삭제 (DELETE)
export async function DELETE(request: Request) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        // URL에서 id 가져오기 (예: /api/categories?id=5)
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID가 필요합니다.' }, { status: 400 });
        }

        const categoryId = Number(id);

        // ⚠️ 중요: 이 카테고리를 쓰는 제품이 있는지 먼저 확인!
        const productCount = await prisma.product.count({
            where: { categoryId: categoryId }
        });

        if (productCount > 0) {
            return NextResponse.json(
                { success: false, message: `이 카테고리에 등록된 제품이 ${productCount}개 있습니다. 제품을 먼저 삭제하거나 옮겨주세요.` },
                { status: 400 }
            );
        }

        // 제품이 없으면 안전하게 삭제
        await prisma.category.delete({
            where: { id: categoryId }
        });

        return NextResponse.json({ success: true, message: "카테고리가 삭제되었습니다." });

    } catch (error) {
        console.error("카테고리 삭제 에러:", error);
        return NextResponse.json({ success: false, message: "삭제 중 오류 발생" }, { status: 500 });
    }
}
