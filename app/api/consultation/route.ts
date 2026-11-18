import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { sendConsultationAdminNotify } from '@/lib/mail/consultationAdminNotify';

// 상담 문의 저장
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      preferredContactMethod = 'phone',
      inquiryType = 'general',
      referralSource,
      message,
      preferredDate,
      preferredTime,
      tags = [],
      _tenantId = null,
    } = body;

    // 필수 필드 검증
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 전화번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증 (이메일이 있는 경우)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: '올바른 이메일 형식이 아닙니다.' },
          { status: 400 }
        );
      }
    }

    connection = await getDbConnection();

    // tags를 JSON 문자열로 변환
    const tagsJson = Array.isArray(tags) && tags.length > 0 
      ? JSON.stringify(tags) 
      : null;

    const [result] = await connection.execute(
      `INSERT INTO consultation_inquiries 
       (name, phone, email, preferred_contact_method, inquiry_type, referral_source, message, preferred_date, preferred_time, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        name,
        phone,
        email || null,
        preferredContactMethod,
        inquiryType,
        referralSource || null,
        message || null,
        preferredDate || null,
        preferredTime || null,
        tagsJson,
      ]
    );

    const insertId = Number((result as { insertId?: number }).insertId);
    void sendConsultationAdminNotify({
      inquiryId: insertId,
      name,
      phone,
      email: email || null,
      preferredContactMethod,
      inquiryType,
      referralSource: referralSource || null,
      message: message || null,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
    }).catch((err) => console.error('[mail] consultation admin notify failed:', err));

    return NextResponse.json({
      success: true,
      id: insertId,
      message: '상담 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
    });
  } catch (error) {
    console.error('Consultation inquiry error:', error);
    return NextResponse.json(
      { success: false, error: '상담 문의 접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Admin list/read endpoints were removed with the homepage admin UI.
// Public inquiries use POST /api/inquiries → Clinic-OS.
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 },
  );
}

