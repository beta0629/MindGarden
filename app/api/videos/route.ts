import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 활성 히어로 비디오 조회 (공개용)
export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, title, video_url, poster_url, description
       FROM hero_videos
       WHERE is_active = 1
       ORDER BY display_order ASC, created_at DESC
       LIMIT 1`
    );

    const videos = rows as any[];
    if (videos.length === 0) {
      // DB에 비디오가 없으면 기본 비디오 반환
      return NextResponse.json({
        success: true,
        video: {
          id: null,
          title: '기본 비디오',
          videoUrl: '/assets/videos/hero-video.mp4',
          posterUrl: null,
          description: '기본 히어로 비디오',
        },
      });
    }

    const video = videos[0];
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        videoUrl: video.video_url,
        posterUrl: video.poster_url,
        description: video.description,
      },
    });
  } catch (error: any) {
    console.error('Get hero video error:', error);
    return NextResponse.json(
      { success: false, error: '비디오를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
