// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const productUpdateSchema = z.object({
    name: z.string().min(1, "이름은 필수입니다.").max(100, "이름은 100자 이내로 입력해주세요.").optional(),
    categoryId: z.number().int().positive("카테고리를 선택해주세요.").optional(),
    spec: z.string().max(200, "제품 스펙은 200자 이내로 입력해주세요.").optional(),
    description: z.string().optional(),
    imageUrl: z.string().url("유효한 URL을 입력해주세요.").optional(),
    isVisible: z.boolean().optional(),
}).partial();


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
        const { id } = await params;
        const productId = parseInt(id);

        const body = await request.json();
        const validatedData = productUpdateSchema.parse(body);

        // Undefined가 아닌 필드만 업데이트 객체에 포함
        const dataToUpdate: { [key: string]: any } = {};
        Object.keys(validatedData).forEach(key => {
            const value = (validatedData as any)[key];
            if (value !== undefined) {
                dataToUpdate[key] = value;
            }
        });

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json(
                { success: false, message: '수정할 내용이 없습니다.' },
                { status: 400 }
            );
        }


        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: dataToUpdate,
        });

        return NextResponse.json({
            success: true,
            message: '제품 정보가 수정되었습니다.',
            product: updatedProduct,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.issues.map(issue => issue.message).join(', ');
            return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
        }
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
