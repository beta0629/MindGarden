import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 활성 배너 조회 (현재 시간 기준으로 기간 내이고 활성화된 모든 배너)
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');

    connection = await getDbConnection();

    const [rows] = await connection.execute(
      `SELECT id, title, content, image_url, link_url, start_datetime, end_datetime, priority
       FROM banners
       WHERE is_active = 1
         AND start_datetime <= ?
         AND end_datetime >= ?
       ORDER BY priority ASC, created_at DESC`,
      [nowStr, nowStr]
    );

    const banners = rows as any[];
    
    if (banners.length === 0) {
      return NextResponse.json({ success: true, banners: [] });
    }

    const bannerList = banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      content: banner.content,
      imageUrl: banner.image_url,
      linkUrl: banner.link_url,
      startDatetime: banner.start_datetime,
      endDatetime: banner.end_datetime,
      priority: banner.priority,
    }));

    return NextResponse.json({
      success: true,
      banners: bannerList,
    });
  } catch (error: any) {
    console.error('Get banner error:', error);
    const errorMessage = error?.message || '알 수 없는 오류';
    const errorCode = error?.code || 'UNKNOWN';
    console.error('Error details:', { message: errorMessage, code: errorCode, stack: error?.stack });
    return NextResponse.json(
      { success: false, error: `배너를 불러오는데 실패했습니다: ${errorMessage} (${errorCode})` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
