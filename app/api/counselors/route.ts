import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 동적 렌더링 강제 (캐시 방지)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 활성 상담사 목록 조회 (공개용)
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await getDbConnection();

    const [rows] = await connection.execute(
      `SELECT id, name, title, profile_image_url, bio, specialties, education, certifications, experience
       FROM counselors
       WHERE is_active = 1
       ORDER BY display_order ASC, created_at DESC`
    );

    const counselors = (rows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      profileImageUrl: row.profile_image_url,
      bio: row.bio,
      specialties: row.specialties,
      education: row.education,
      certifications: row.certifications,
      experience: row.experience,
    }));

    return NextResponse.json(
      {
        success: true,
        counselors,
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
    console.error('Get counselors error:', error);
    return NextResponse.json(
      { success: false, error: `상담사 목록을 불러오는데 실패했습니다: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
