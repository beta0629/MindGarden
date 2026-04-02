import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자용 후기 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    // 인증 확인
    const cookies = request.cookies;
    const authCookie = cookies.get('blog_admin_token');
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 후기 존재 확인
    const [existingRows] = await connection.execute(
      `SELECT id FROM homepage_reviews WHERE id = ?`,
      [id]
    );
    const existingReview = (existingRows as any[])[0];

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '후기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 후기 삭제
    await connection.execute(`DELETE FROM homepage_reviews WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: '후기가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('Delete admin review error:', error);
    return NextResponse.json(
      { success: false, error: '후기 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
