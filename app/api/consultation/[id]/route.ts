import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const authCookie = request.cookies.get('blog_admin_token');
  return !!authCookie && !!authCookie.value;
}

// 상담 문의 상태 업데이트
export async function PATCH(
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
    const body = await request.json();
    const { status } = body;
    const id = parseInt(params.id);

    if (!status || !['pending', 'contacted', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '올바른 상태 값이 아닙니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const [result] = await connection.execute(
      'UPDATE consultation_inquiries SET status = ? WHERE id = ?',
      [status, id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: '상담 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '상태가 업데이트되었습니다.',
    });
  } catch (error: any) {
    console.error('Update consultation status error:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
