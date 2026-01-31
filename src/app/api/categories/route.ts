import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyIdParam = searchParams.get('companyId');
        
        // 타입 안전성을 위해 Prisma.CategoryWhereInput 타입을 명시합니다.
        const where: Prisma.CategoryWhereInput = companyIdParam 
            ? { companyId: Number(companyIdParam) } 
            : {};

        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ success: true, categories });
    } catch (error) {
        return NextResponse.json({ success: false, error: '카테고리 로딩 실패' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;

        const { name, companyId } = await request.json();

        if (!companyId) {
            return NextResponse.json({ success: false, message: '기업을 선택해야 합니다.' }, { status: 400 });
        }

        const existing = await prisma.category.findFirst({ where: { name, companyId: Number(companyId) } });
        if (existing) {
            return NextResponse.json({ success: false, message: '해당 기업에 이미 존재하는 카테고리입니다.' }, { status: 400 });
        }

        const newCategory = await prisma.category.create({ data: { name, companyId: Number(companyId) } });
        return NextResponse.json({ success: true, category: newCategory });
    } catch (error) {
        return NextResponse.json({ success: false, error: '카테고리 추가 실패' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, message: 'ID가 필요합니다.' }, { status: 400 });
        }

        const categoryId = Number(id);
        const productCount = await prisma.product.count({
            where: { categoryId }
        });

        if (productCount > 0) {
            return NextResponse.json({ success: false, message: `이 카테고리에 등록된 제품이 ${productCount}개 있습니다. 제품을 먼저 삭제하거나 옮겨주세요.` }, { status: 400 });
        }

        await prisma.category.delete({ where: { id: categoryId } });
        return NextResponse.json({ success: true, message: "카테고리가 삭제되었습니다." });
    } catch (error) {
        console.error("카테고리 삭제 에러:", error);
        return NextResponse.json({ success: false, message: "삭제 중 오류 발생" }, { status: 500 });
    }
}