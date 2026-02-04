import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// 1. 문의 목록 조회 (GET)
// 관리자 페이지에서 문의 리스트를 볼 때 사용합니다.
export async function GET(request: NextRequest) {
    try {
        const inquiries = await prisma.inquiry.findMany({
            orderBy: { createdAt: 'desc' }, // 최신순 정렬
        });

        return NextResponse.json({ success: true, inquiries });
    } catch (error) {
        console.error('문의 목록 조회 실패:', error);
        return NextResponse.json(
            { success: false, message: '목록을 불러오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 2. 문의 등록 (POST)
// 고객이 '문의하기' 버튼을 눌렀을 때 실행됩니다. (로그인 불필요)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // 필드명은 프론트엔드 폼과 Prisma 스키마에 맞춰야 합니다.
        // 스키마: name, phone, email, content, product, company
        let {
            name,
            phoneNumber,
            email,
            message,
            productName,
            company,
            phone,
            content,
            product,
        } = body;

        phoneNumber = phoneNumber ?? phone ?? '';
        message = message ?? content ?? '';
        productName = productName ?? product ?? '';

        // 유효성 검사
        if (!name || !phoneNumber || !message) {
            return NextResponse.json(
                { success: false, message: '이름, 연락처, 내용은 필수 입력 항목입니다.' },
                { status: 400 }
            );
        }

        // DB에 저장
        const newInquiry = await prisma.inquiry.create({
            data: {
                name,
                phone: phoneNumber,      // 스키마의 phone 필드에 매핑
                email: email || '',
                content: message,        // 스키마의 content 필드에 매핑
                product: productName || '', // 스키마의 product 필드에 매핑
                company: company || '',  // 회사명 (선택)
            },
        });

        // 2. 이메일 전송 설정 (Nodemailer)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 3. 메일 내용 구성
        const mailOptions = {
            from: process.env.EMAIL_USER, // 보내는 사람
            to: process.env.EMAIL_USER,   // 받는 사람 (관리자 이메일)
            subject: `[홈페이지 문의] ${name}님의 새로운 문의입니다.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #2563eb;">새로운 문의가 도착했습니다.</h2>
                    <p><strong>이름:</strong> ${name}</p>
                    <p><strong>연락처:</strong> ${phoneNumber}</p>
                    <p><strong>이메일:</strong> ${email || '없음'}</p>
                    <p><strong>회사명:</strong> ${company || '없음'}</p>
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
                    <h3 style="color: #333;">문의 내용</h3>
                    <p style="white-space: pre-wrap; color: #555;">${message}</p>
                </div>
            `,
        };

        // 4. 메일 발송
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: '문의가 성공적으로 접수되었습니다.', inquiry: newInquiry });

    } catch (error) {
        console.error('문의 등록 에러:', error);
        return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
