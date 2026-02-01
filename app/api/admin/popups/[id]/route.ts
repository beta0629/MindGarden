import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const cookies = request.cookies;
  const authCookie = cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

// 팝업 수정
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

    await connection.execute(
      `UPDATE popups
       SET title = ?, content = ?, image_url = ?, link_url = ?, start_datetime = ?, end_datetime = ?, is_active = ?, priority = ?
       WHERE id = ?`,
      [
        title,
        content || null,
        null, // image_url은 더 이상 사용하지 않음 (호환성을 위해 null 저장)
        linkUrl || null,
        startDatetime,
        endDatetime,
        isActive ? 1 : 0,
        priority || 0,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update popup error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });
    const errorMessage = error?.message || error?.sqlMessage || '알 수 없는 오류';
    return NextResponse.json(
      { success: false, error: `팝업 수정에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 팝업 삭제
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

    await connection.execute('DELETE FROM popups WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete popup error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
