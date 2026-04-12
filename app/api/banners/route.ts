import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 활성 배너 조회 (현재 시간 기준으로 기간 내이고 활성화된 모든 배너)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await getDbConnection();

    // 데이터베이스의 현재 시간을 직접 사용 (타임존 문제 방지)
    const [rows] = await connection.execute(
      `SELECT id, title, content, image_url, link_url, start_datetime, end_datetime, priority
       FROM banners
       WHERE is_active = 1
         AND start_datetime <= NOW()
         AND end_datetime >= NOW()
       ORDER BY priority ASC, created_at DESC`
    );

    const banners = rows as any[];
    
    // 디버깅: 쿼리 결과 로그
    console.log('Banner query result:', {
      rowCount: banners.length,
      rows: banners,
      sample: banners[0]
    });
    
    if (banners.length === 0) {
      // 디버깅: 빈 결과일 때 전체 배너 확인
      const [allRows] = await connection.execute(
        `SELECT id, title, is_active, start_datetime, end_datetime, NOW() AS server_now
         FROM banners
         ORDER BY id DESC
         LIMIT 5`
      );
      console.log('All banners (for debugging):', allRows);
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

    // 캐시 방지 헤더 추가
    return NextResponse.json(
      {
        success: true,
        banners: bannerList,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.warn('Get banners: DB unavailable, returning empty list:', error?.code || error?.message);
    return NextResponse.json(
      { success: true, banners: [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
