import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// MySQL 연결 설정
const getDbConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'beta0629.cafe24.com',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'mindgarden_dev',
    password: process.env.DB_PASSWORD || 'MindGardenDev2025!@#',
    database: process.env.DB_NAME || 'core_solution',
  });
};

// 갤러리 이미지 목록 조회
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true'; // 관리자용: 모든 이미지 조회

    connection = await getDbConnection();

    let query = `SELECT id, image_url, alt_text, display_order, is_active 
                 FROM gallery_images`;
    
    if (!all) {
      query += ` WHERE is_active = 1`;
    }
    
    query += ` ORDER BY display_order ASC, created_at ASC`;

    const [rows] = await connection.execute(query);

    if (all) {
      // 관리자용: 전체 정보 반환
      return NextResponse.json({
        success: true,
        images: (rows as any[]).map((row: any) => ({
          id: row.id,
          imageUrl: row.image_url,
          altText: row.alt_text,
          displayOrder: row.display_order,
          isActive: row.is_active === 1,
        })),
      });
    } else {
      // 일반용: 활성화된 이미지만 반환
      const images = (rows as any[]).map((row: any) => ({
        url: row.image_url,
        alt: row.alt_text || '갤러리 이미지',
      }));

      return NextResponse.json({
        success: true,
        images: images.length > 0 ? images : null, // null이면 기본 이미지 사용
      });
    }
  } catch (error) {
    console.error('Get gallery images error:', error);
    return NextResponse.json(
      { success: false, error: '갤러리 이미지를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 갤러리 이미지 추가 (관리자용)
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { imageUrl, altText, displayOrder = 0, tenantId = null } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '이미지 URL은 필수입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const [result] = await connection.execute(
      `INSERT INTO gallery_images (tenant_id, image_url, alt_text, display_order, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [tenantId, imageUrl, altText || null, displayOrder]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: '갤러리 이미지가 추가되었습니다.',
    });
  } catch (error) {
    console.error('Add gallery image error:', error);
    return NextResponse.json(
      { success: false, error: '갤러리 이미지 추가에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

