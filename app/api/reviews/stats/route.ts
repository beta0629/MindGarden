import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 후기 통계 조회
export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await getDbConnection();
    
    // 승인된 후기만 조회
    const [rows] = await connection.execute(
      `SELECT tags, ratings FROM homepage_reviews WHERE is_approved = 1`
    );
    
    const reviews = rows as any[];
    
    // 해시태그 통계
    const tagCounts: Record<string, number> = {};
    
    // 점수 통계
    const ratingStats: Record<string, { sum: number; count: number; average: number }> = {
      professionalism: { sum: 0, count: 0, average: 0 },
      kindness: { sum: 0, count: 0, average: 0 },
      effectiveness: { sum: 0, count: 0, average: 0 },
      facility: { sum: 0, count: 0, average: 0 },
      overall: { sum: 0, count: 0, average: 0 },
    };
    
    reviews.forEach((review: any) => {
      // 해시태그 통계
      try {
        if (review.tags) {
          const tags = JSON.parse(review.tags);
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        }
      } catch (e) {
        // 무시
      }
      
      // 점수 통계
      try {
        if (review.ratings) {
          const ratings = JSON.parse(review.ratings);
          Object.keys(ratingStats).forEach(key => {
            if (ratings[key] && ratings[key] > 0) {
              ratingStats[key].sum += ratings[key];
              ratingStats[key].count += 1;
            }
          });
        }
      } catch (e) {
        // 무시
      }
    });
    
    // 평균 계산
    Object.keys(ratingStats).forEach(key => {
      if (ratingStats[key].count > 0) {
        ratingStats[key].average = ratingStats[key].sum / ratingStats[key].count;
      }
    });
    
    // 해시태그를 빈도순으로 정렬
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }));
    
    return NextResponse.json({
      success: true,
      stats: {
        totalReviews: reviews.length,
        tagCounts: sortedTags,
        ratingStats,
      },
    });
  } catch (error: any) {
    console.error('Get review stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '통계를 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
