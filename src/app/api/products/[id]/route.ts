// src/app/api/products/[id]/route.ts

// [1] 모듈 가져오기
// NextResponse: Next.js에서 표준 HTTP 응답(성공, 실패, JSON 데이터 등)을 만들기 위한 도구입니다.
import { NextResponse } from 'next/server';
// prisma: 데이터베이스와 통신하기 위해 우리가 미리 설정해둔 연결 도구(싱글톤)입니다.
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// ----------------------------------------------------------------------
// [중요: Next.js 15+ 버전의 변경사항]
// 과거에는 params가 그냥 객체였지만, 최신 버전(15 이상)부터는 
// params가 'Promise'(비동기 객체)로 변경되었습니다.
// 따라서 함수 내부에서 반드시 'await params'를 통해 값을 꺼내야 합니다.
// ----------------------------------------------------------------------

// --------------------------------------------------------
// 1. 상세 조회 함수 (GET)
// 용도: ID를 받아서 그 제품 딱 하나만 찾아서 보여줍니다.
// 경로: GET /api/products/1 (예시)
// --------------------------------------------------------
export async function GET(
    request: Request,
    // 두 번째 인자는 'Context'라고 하며, 여기에 동적 경로 변수(params)가 들어있습니다.
    // Next.js 15 규칙에 따라 params를 Promise 타입으로 정의합니다.
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // [Step 1] URL 경로에 있는 id 값을 꺼냅니다.
        // params는 Promise이므로 await를 써서 기다려야 진짜 내용물({ id: "1" })이 나옵니다.
        const { id } = await params;

        // [Step 2] ID 형변환
        // URL에 적힌 숫자는 컴퓨터가 볼 때는 문자열("1")입니다.
        // 하지만 DB의 ID는 숫자(1)이므로, 계산을 위해 숫자로 바꿔줍니다(parseInt).
        const productId = parseInt(id);

        // [Step 3] DB 조회 (Prisma)
        // findUnique: '고유한 값'(여기선 ID)으로 데이터 1개를 찾습니다.
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        // [Step 4] 예외 처리: 없는 제품일 경우
        // DB를 다 뒤져봤는데 product가 null이라면(없다면) 404 에러를 냅니다.
        if (!product) {
            return NextResponse.json(
                { success: false, message: '해당 제품을 찾을 수 없습니다.' },
                { status: 404 } // 404: Not Found (못 찾음)
            );
        }

        // [Step 5] 성공 응답
        // 찾은 제품 정보를 JSON 상자에 담아서 프론트엔드로 보냅니다.
        return NextResponse.json({ success: true, product });

    } catch (error) {
        // 서버 내부에서 코드가 꼬이거나 DB가 죽었을 때 실행됩니다.
        console.error('상세 조회 에러:', error);
        return NextResponse.json(
            { success: false, message: '서버 에러가 발생했습니다.' },
            { status: 500 } // 500: Internal Server Error (서버 잘못)
        );
    }
}

// --------------------------------------------------------
// 2. 수정 함수 (PATCH)
// 용도: 특정 제품의 내용 중 일부(이름, 설명 등)를 수정합니다.
// 경로: PATCH /api/products/1
// --------------------------------------------------------
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        // [Step 1] ID 확보 (GET과 동일)
        const { id } = await params;
        const productId = parseInt(id);

        // [Step 2] 요청 본문(Body) 읽기
        // 프론트엔드에서 보낸 수정할 데이터(JSON)를 자바스크립트 객체로 변환합니다.
        const body = await request.json();

        // [Step 3] DB 업데이트 (Prisma)
        // update 함수는 where로 대상을 찾고, data로 내용을 바꿉니다.
        const updatedProduct = await prisma.product.update({
            where: { id: productId }, // 누구를?
            data: {                   // 무엇으로?
                name: body.name,        // body에 name이 있으면 그걸로 덮어쓰기
                category: body.category,
                spec: body.spec,
                description: body.description,
                imageUrl: body.imageUrl,
                isVisible: body.isVisible,
            },
        });

        // [Step 4] 성공 응답
        // 수정이 완료된 최신 데이터를 돌려줍니다.
        return NextResponse.json({
            success: true,
            message: '제품 정보가 수정되었습니다.',
            product: updatedProduct,
        });

    } catch (error) {
        // 존재하지 않는 ID를 수정하려 하면 Prisma가 에러를 냅니다.
        console.error('수정 에러:', error);
        return NextResponse.json(
            { success: false, message: '제품 수정 실패 (존재하지 않는 ID일 수 있습니다)' },
            { status: 500 }
        );
    }
}

// --------------------------------------------------------
// 3. 삭제 함수 (DELETE)
// 용도: 특정 제품을 DB에서 완전히 지워버립니다.
// 경로: DELETE /api/products/1
// --------------------------------------------------------
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = requireAdmin(request);
        if (authError) return authError;
        // [Step 1] ID 확보
        const { id } = await params;
        const productId = parseInt(id);

        // [Step 2] DB 삭제 (Prisma)
        // delete 함수는 where 조건에 맞는 데이터를 삭제합니다.
        await prisma.product.delete({
            where: { id: productId },
        });

        // [Step 3] 성공 응답
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
