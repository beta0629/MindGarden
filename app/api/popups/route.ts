import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 활성 팝업 조회 (현재 시간 기준으로 기간 내이고 활성화된 것 중 우선순위 가장 높은 것)
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await getDbConnection();

    // 데이터베이스의 현재 시간을 직접 사용 (타임존 문제 방지)
    const [rows] = await connection.execute(
      `SELECT id, title, content, image_url, link_url, start_datetime, end_datetime, priority
       FROM popups
       WHERE is_active = 1
         AND start_datetime <= NOW()
         AND end_datetime >= NOW()
       ORDER BY priority ASC, created_at DESC
       LIMIT 1`
    );

    const popups = rows as any[];
    
    if (popups.length === 0) {
      return NextResponse.json({ success: true, popup: null });
    }

    const popup = popups[0];
    return NextResponse.json({
      success: true,
      popup: {
        id: popup.id,
        title: popup.title,
        content: popup.content,
        imageUrl: popup.image_url,
        linkUrl: popup.link_url,
        startDatetime: popup.start_datetime,
        endDatetime: popup.end_datetime,
        priority: popup.priority,
      },
    });
  } catch (error: any) {
    console.error('Get popup error:', error);
    const errorMessage = error?.message || '알 수 없는 오류';
    const errorCode = error?.code || 'UNKNOWN';
    console.error('Error details:', { message: errorMessage, code: errorCode, stack: error?.stack });
    return NextResponse.json(
      { success: false, error: `팝업을 불러오는데 실패했습니다: ${errorMessage} (${errorCode})` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
