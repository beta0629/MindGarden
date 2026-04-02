import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const cookies = request.cookies;
  const authCookie = cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

// 배너 수정
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
      title,
      content,
      imageUrl,
      linkUrl,
      startDatetime,
      endDatetime,
      isActive,
      priority,
    } = body;

    // 필수 필드 검증
    if (!title || !startDatetime || !endDatetime) {
      return NextResponse.json(
        { success: false, error: '제목, 시작일시, 종료일시는 필수입니다.' },
        { status: 400 }
      );
    }

    // 날짜 검증
    const startDate = new Date(startDatetime);
    const endDate = new Date(endDatetime);
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: '종료일시는 시작일시보다 이후여야 합니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // imageUrl 처리: 빈 문자열이나 공백만 있는 경우 null로 변환
    const imageUrlValue = imageUrl && imageUrl.trim() !== '' ? imageUrl : null;
    console.log('Updating banner with imageUrl:', {
      id,
      imageUrl,
      imageUrlValue,
      hasImageUrl: !!imageUrlValue,
    });

    await connection.execute(
      `UPDATE banners
       SET title = ?, content = ?, image_url = ?, link_url = ?, start_datetime = ?, end_datetime = ?, is_active = ?, priority = ?
       WHERE id = ?`,
      [
        title,
        content || null,
        imageUrlValue,
        linkUrl || null,
        startDatetime,
        endDatetime,
        isActive ? 1 : 0,
        priority || 0,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update banner error:', error);
    return NextResponse.json(
      { success: false, error: '배너 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 배너 삭제
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

    await connection.execute('DELETE FROM banners WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json(
      { success: false, error: '배너 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
