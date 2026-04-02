import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 후기 좋아요 증가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 후기 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();
    
    // 좋아요 수 증가
    await connection.execute(
      `UPDATE homepage_reviews 
       SET like_count = like_count + 1 
       WHERE id = ?`,
      [id]
    );

    // 업데이트된 좋아요 수 조회
    const [rows] = await connection.execute(
      `SELECT like_count FROM homepage_reviews WHERE id = ?`,
      [id]
    );
    const review = (rows as any[])[0];

    return NextResponse.json({
      success: true,
      likeCount: review?.like_count || 0,
    });
  } catch (error: any) {
    console.error('Like review error:', error);
    return NextResponse.json(
      { success: false, error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
