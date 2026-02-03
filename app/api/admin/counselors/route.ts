import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const cookies = request.cookies;
  const authCookie = cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

// 상담사 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    connection = await getDbConnection();

    const [rows] = await connection.execute(
      `SELECT id, name, title, profile_image_url, bio, specialties, education, certifications, experience, display_order, is_active, created_at, updated_at
       FROM counselors
       ORDER BY display_order ASC, created_at DESC`
    );

    const counselors = (rows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      profileImageUrl: row.profile_image_url,
      bio: row.bio,
      specialties: row.specialties,
      education: row.education,
      certifications: row.certifications,
      experience: row.experience,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, counselors });
  } catch (error: any) {
    console.error('Get counselors error:', error);
    return NextResponse.json(
      { success: false, error: `상담사 목록을 불러오는데 실패했습니다: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 상담사 생성
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    const body = await request.json();
    const {
      name,
      title,
      profileImageUrl,
      bio,
      specialties,
      education,
      certifications,
      experience,
      displayOrder = 0,
      isActive = true,
    } = body;

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { success: false, error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const [result] = await connection.execute(
      `INSERT INTO counselors (name, title, profile_image_url, bio, specialties, education, certifications, experience, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        title || null,
        profileImageUrl || null,
        bio || null,
        specialties || null,
        education || null,
        certifications || null,
        experience || null,
        displayOrder || 0,
        isActive ? 1 : 0,
      ]
    );

    const insertResult = result as any;
    return NextResponse.json({
      success: true,
      counselor: {
        id: insertResult.insertId,
        name,
        title,
        profileImageUrl,
        bio,
        specialties,
        education,
        certifications,
        experience,
        displayOrder,
        isActive,
      },
    });
  } catch (error: any) {
    console.error('Create counselor error:', error);
    return NextResponse.json(
      { success: false, error: '상담사 등록에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
