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

// 갤러리 이미지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  
  try {
    const body = await request.json();
    const { imageUrl, altText, displayOrder, isActive } = body;

    connection = await getDbConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(imageUrl);
    }
    if (altText !== undefined) {
      updates.push('alt_text = ?');
      values.push(altText);
    }
    if (displayOrder !== undefined) {
      updates.push('display_order = ?');
      values.push(displayOrder);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    values.push(parseInt(params.id));

    await connection.execute(
      `UPDATE gallery_images SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: '갤러리 이미지가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update gallery image error:', error);
    return NextResponse.json(
      { success: false, error: '갤러리 이미지 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 갤러리 이미지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  
  try {
    connection = await getDbConnection();

    await connection.execute(
      'DELETE FROM gallery_images WHERE id = ?',
      [parseInt(params.id)]
    );

    return NextResponse.json({
      success: true,
      message: '갤러리 이미지가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    return NextResponse.json(
      { success: false, error: '갤러리 이미지 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

