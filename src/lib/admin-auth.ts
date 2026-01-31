import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function requireAdmin(request: NextRequest): NextResponse | null {
    const tokenCookie = request.cookies.get('auth_token');

    if (!tokenCookie) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = tokenCookie.value;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not set');
        return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    try {
        jwt.verify(token, secret);
        return null;
    } catch (err) {
        console.error('JWT verification error:', err);
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
}
