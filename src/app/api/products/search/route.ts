import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/search?q=keyword
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim().slice(0, 100) || '';

        // 빈 검색어일 때는 빈 배열 반환
        if (!query) {
            return NextResponse.json({ success: true, products: [] });
        }

        // DB에서 제품 검색 (이름 부분 일치, 대소문자 무시, 공개 제품만)
        const products = await prisma.product.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                isVisible: true,
            },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                category: { select: { name: true } },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
        });

        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            category: p.category.name,
        }));

        return NextResponse.json({ success: true, products: formattedProducts });

    } catch (error) {
        console.error('제품 검색 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
