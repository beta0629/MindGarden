import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// MySQL 연결 설정
const getDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'beta0629.cafe24.com',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'mindgarden_dev',
    password: process.env.DB_PASSWORD || 'MindGardenDev2025!@#',
    database: process.env.DB_NAME || 'core_solution',
  });
};

// 블로그 이미지 업로드
export async function POST(request: NextRequest) {
  let connection: mysql.PoolConnection | null = null;
  
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

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '이미지 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'blog');
    
    // 디렉토리 생성
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL 생성
    const imageUrl = `/uploads/blog/${fileName}`;

    // DB에 저장 (선택사항 - 필요시)
    // connection = await getDbConnection();
    // await connection.execute(
    //   `INSERT INTO blog_images (image_url, created_at) VALUES (?, NOW())`,
    //   [imageUrl]
    // );

    return NextResponse.json({
      success: true,
      imageUrl,
      url: imageUrl, // 호환성을 위해
    });
  } catch (error) {
    console.error('Upload blog image error:', error);
    return NextResponse.json(
      { success: false, error: '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

