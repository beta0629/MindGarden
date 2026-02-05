import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

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
      tenantId = null,
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

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
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
      await connection.end();
    }
  }
}

// 상담 문의 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    connection = await getDbConnection();

    let query = 'SELECT * FROM consultation_inquiries';
    const params: any[] = [];

    if (status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    // LIMIT와 OFFSET은 플레이스홀더를 사용할 수 없으므로 직접 값을 넣어야 함
    // 값은 이미 parseInt로 검증되었으므로 안전함
    query += ` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = params.length > 0 
      ? await connection.execute(query, params)
      : await connection.execute(query);

    // snake_case를 camelCase로 변환
    const inquiries = (rows as any[]).map((row: any) => {
      let tags = [];
      try {
        tags = row.tags ? JSON.parse(row.tags) : [];
      } catch (e) {
        // JSON 파싱 실패 시 빈 배열
        tags = [];
      }
      
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        preferredContactMethod: row.preferred_contact_method,
        inquiryType: row.inquiry_type,
        referralSource: row.referral_source,
        message: row.message,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        tags,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      inquiries,
    });
  } catch (error: any) {
    console.error('Get inquiries error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: `문의 목록을 불러오는데 실패했습니다: ${error?.message || '알 수 없는 오류'}` 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

