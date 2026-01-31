import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function requireAdmin(request: Request): NextResponse | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not set');
        return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    try {
        jwt.verify(token, secret);
        return null;
    } catch {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
}
