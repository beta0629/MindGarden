import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const cookies = request.cookies;
  const authCookie = cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

// 상담사 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

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
      displayOrder,
      isActive,
    } = body;

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { success: false, error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    await connection.execute(
      `UPDATE counselors
       SET name = ?, title = ?, profile_image_url = ?, bio = ?, specialties = ?, education = ?, certifications = ?, experience = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
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
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update counselor error:', error);
    return NextResponse.json(
      { success: false, error: '상담사 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 상담사 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    await connection.execute('DELETE FROM counselors WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete counselor error:', error);
    return NextResponse.json(
      { success: false, error: '상담사 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
