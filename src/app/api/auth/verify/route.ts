import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    return NextResponse.json({ success: true });
}
