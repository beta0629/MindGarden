import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// MySQL 연결 설정
const getDbConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'beta0629.cafe24.com',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'mindgarden_dev',
    password: process.env.DB_PASSWORD || 'MindGardenDev2025!@#',
    database: process.env.DB_NAME || 'core_solution',
  });
};

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
      message,
      preferredDate,
      preferredTime,
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

    const [result] = await connection.execute(
      `INSERT INTO consultation_inquiries 
       (tenant_id, name, phone, email, preferred_contact_method, inquiry_type, message, preferred_date, preferred_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        tenantId,
        name,
        phone,
        email || null,
        preferredContactMethod,
        inquiryType,
        message || null,
        preferredDate || null,
        preferredTime || null,
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

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await connection.execute(query, params);

    return NextResponse.json({
      success: true,
      inquiries: rows,
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { success: false, error: '문의 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

