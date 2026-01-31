// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/products/1
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true } // 카테고리 정보 포함
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: '해당 제품을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        // 데이터 포맷팅
        const formattedProduct = {
            ...product,
            category: product.category.name,
            companyId: product.category.companyId
        };


        return NextResponse.json({ success: true, product: formattedProduct });

    } catch (error) {
        console.error('상세 조회 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 에러가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/products/1
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        
        const { id } = await params;
        const productId = parseInt(id);

        const body = await request.json();

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name: body.name,
                categoryId: body.categoryId ? Number(body.categoryId) : undefined,
                spec: body.spec,
                description: body.description,
                imageUrl: body.imageUrl,
                isVisible: body.isVisible,
            },
        });

        return NextResponse.json({
            success: true,
            message: '제품 정보가 수정되었습니다.',
            product: updatedProduct,
        });

    } catch (error) {
        console.error('수정 에러:', error);
        return NextResponse.json(
            { success: false, message: '제품 수정 실패 (존재하지 않는 ID일 수 있습니다)' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/1
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        
        const { id } = await params;
        const productId = parseInt(id);

        await prisma.product.delete({
            where: { id: productId },
        });

        return NextResponse.json({
            success: true,
            message: '제품이 삭제되었습니다.',
        });

    } catch (error) {
        console.error('삭제 에러:', error);
        return NextResponse.json(
            { success: false, message: '제품 삭제 실패' },
            { status: 500 }
        );
    }
}
