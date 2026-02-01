import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자용 후기 목록 조회 (모든 후기)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    connection = await getDbConnection();
    // MySQL2에서 LIMIT/OFFSET은 플레이스홀더 대신 직접 값을 사용 (SQL 인젝션 방지를 위해 숫자로 변환)
    const safeLimit = Math.max(1, Math.min(100, limit)); // 1-100 사이로 제한
    const safeOffset = Math.max(0, offset); // 0 이상으로 제한
    const [rows] = await connection.execute(
      `SELECT id, author_name, content, is_approved, created_at, updated_at
       FROM homepage_reviews
       ORDER BY created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    // 전체 개수 조회
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) as total FROM homepage_reviews`
    );
    const total = (countRows as any[])[0].total;

    const reviews = (rows as any[]).map((row: any) => ({
      id: row.id,
      authorName: row.author_name,
      content: row.content,
      isApproved: row.is_approved,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get admin reviews error:', error);
    return NextResponse.json(
      { success: false, error: '후기 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
