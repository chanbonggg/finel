// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET 함수: 제품 목록을 조회할 때 사용합니다.
export async function GET() {
    try {
        // 1. DB에서 모든 제품(product)을 가져옵니다.
        // findMany(): 조건 없이 다 가져오라는 뜻입니다.
        const products = await prisma.product.findMany({
            // 정렬 옵션: 최신순(createdAt 내림차순)으로 가져옵니다.
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                category: true
            }
        });

        const formattedProducts = products.map(p => ({
            ...p,
            category: p.category.name, // product.category.name 을 그냥 product.category 로 변환
            companyId: p.category.companyId // 회사 ID 추가
        }));

        return NextResponse.json({ success: true, products: formattedProducts });

    } catch (error) {
        console.error('제품 목록 조회 에러:', error);
        // 에러 발생 시 500 상태코드와 메시지를 보냅니다.
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST 함수: 새로운 제품을 데이터베이스에 등록합니다.
export async function POST(request: NextRequest) {
    try {
        // 1. 프론트엔드에서 보낸 데이터(Body)를 받습니다.
        const body = await request.json();

        // 데이터 분해 할당 (편하게 쓰기 위해 변수로 꺼냄)
        const { name, categoryId, spec, description, imageUrl } = body;

        // 2. 필수 입력값 검사 (이름이나 카테고리가 없으면 안 됨)
        // (이미지는 나중에 필수로 바꿀 수 있습니다)
        if (!name || !categoryId || !spec) {
            return NextResponse.json(
                { success: false, message: '제품명과 카테고리, 사양은 필수입니다.' },
                { status: 400 }
            );
        }

        // 3. DB에 저장 (Prisma가 자동으로 SQL을 날려줍니다)
        const newProduct = await prisma.product.create({
            data: {
                name,         // name: name 과 같음
                categoryId: Number(categoryId),
                spec: spec || '', // 값이 없으면 빈 문자열로 저장
                description: description || '',
                imageUrl: imageUrl || '', // 아직 이미지 업로드가 없으니 빈 값 허용
                isVisible: true, // 기본값: 공개
            },
        });

        const productWithCategory = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: { category: true }
        });

        // 데이터 포맷팅
        const formattedProduct = {
            ...productWithCategory,
            category: productWithCategory?.category.name, // 이름을 꺼내줌
            companyId: productWithCategory?.category.companyId // 회사 ID 추가
        };

        // 4. 성공 응답 (등록된 제품 정보를 돌려줍니다)
        return NextResponse.json({
            success: true,
            message: '제품이 성공적으로 등록되었습니다.',
            product: formattedProduct,
        }, { status: 201 }); // 201: Created (생성됨)

    } catch (error) {
        console.error('제품 등록 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
