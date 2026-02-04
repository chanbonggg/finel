import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a category
const createCategorySchema = z.object({
  name: z.string().min(1, '카테고리 이름은 필수 항목입니다.'),
  companyId: z.number().int(),
});

// GET handler for fetching categories by companyId
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ success: false, message: '회사 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        companyId: Number(companyId),
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    return NextResponse.json({ success: false, message: '카테고리를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST handler for adding a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        companyId: validatedData.companyId,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(issue => issue.message).join(', ');
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    console.error('카테고리 추가 실패:', error);
    return NextResponse.json({ success: false, message: '카테고리 추가 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE handler for deleting a category
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: '카테고리 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const productCount = await prisma.product.count({
      where: { categoryId: Number(id) },
    });

    if (productCount > 0) {
      return NextResponse.json({ success: false, message: '해당 카테고리에 속한 제품이 있어 삭제할 수 없습니다.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true, message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    return NextResponse.json({ success: false, message: '카테고리 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}