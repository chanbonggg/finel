import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAdminPayload } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    // 1. requireAdmin을 호출하여 인증 결과를 받습니다.
    const authResult = await requireAdmin(request);

    // 2. 타입 가드를 사용하여 인증 실패(NextResponse)인지 성공(AdminPayload)인지 확인합니다.
    if (!isAdminPayload(authResult)) {
        return authResult; // 인증 실패 시 받은 NextResponse를 그대로 반환합니다.
    }

    // 3. 인증 성공: authResult는 이제 안전하게 AdminPayload로 사용할 수 있습니다.
    return NextResponse.json({ success: true, user: authResult });
}
