import { NextRequest, NextResponse } from 'next/server';
import type { Inquiry } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

type MailErrorShape = {
  message?: string;
  code?: string;
  responseCode?: number;
  command?: string;
};

export async function GET() {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();    const {
      name,
      phoneNumber: rawPhoneNumber,
      email,
      message: rawMessage,
      productName: rawProductName,
      company,
      phone,
      content,
      product,
    } = body;

    const phoneNumber = rawPhoneNumber ?? phone ?? '';
    const message = rawMessage ?? content ?? '';
    const productName = rawProductName ?? product ?? '';

    if (!name || !phoneNumber || !message) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'VALIDATION_FAILED',
          stage: 'VALIDATION',
          message: '이름, 연락처, 문의 내용은 필수 입력 항목입니다.',
        },
        { status: 400 }
      );
    }

    let newInquiry: Inquiry;
    try {
      newInquiry = await prisma.inquiry.create({
        data: {
          name,
          phone: phoneNumber,
          email: email || '',
          content: message,
          product: productName || '',
          company: company || '',
        },
      });
    } catch (dbError) {
      console.error('문의 DB 저장 실패:', dbError);
      return NextResponse.json(
        {
          success: false,
          errorCode: 'DB_WRITE_FAILED',
          stage: 'DB_WRITE',
          message: '문의 저장에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `[문의] ${name}님의 새 문의입니다.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb;">새로운 문의가 접수되었습니다.</h2>
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

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      const error = mailError as MailErrorShape;
      console.error('문의 저장 후 메일 발송 실패:', {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
      });

      return NextResponse.json(
        {
          success: false,
          errorCode: 'MAIL_SEND_FAILED',
          stage: 'MAIL_SEND',
          inquirySaved: true,
          inquiryId: newInquiry.id,
          message: '문의는 접수되었지만 메일 발송에 실패했습니다.',
          mailError: {
            message: error.message ?? 'Unknown mail error',
            code: error.code ?? null,
            responseCode: error.responseCode ?? null,
            command: error.command ?? null,
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        stage: 'DONE',
        message: '문의가 성공적으로 접수되었습니다.',
        mailSent: true,
        inquiry: newInquiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('문의 등록 에러:', error);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'UNEXPECTED_ERROR',
        stage: 'UNKNOWN',
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}


