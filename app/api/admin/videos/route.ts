import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { getDbConnection } from '@/lib/db';

// 히어로 비디오 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  let connection;
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

    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, title, video_url, poster_url, description, is_active, display_order, created_at, updated_at
       FROM hero_videos
       ORDER BY display_order ASC, created_at DESC`
    );

    const videos = (rows as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      videoUrl: row.video_url,
      posterUrl: row.poster_url,
      description: row.description,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error('Get hero videos error:', error);
    return NextResponse.json(
      { success: false, error: '비디오 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 히어로 비디오 생성
export async function POST(request: NextRequest) {
  let connection;
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
    const file = formData.get('video') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'true';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '비디오 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: '제목이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (100MB 제한)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '비디오 크기는 100MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 확인
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: '비디오 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 읽기
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `hero_video_${timestamp}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');
    
    // 디렉토리 생성
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL 생성
    const videoUrl = `/uploads/videos/${fileName}`;

    // 포스터 이미지는 나중에 생성 가능 (현재는 null)
    const posterUrl = null;

    // DB에 저장
    connection = await getDbConnection();
    const [result] = await connection.execute(
      `INSERT INTO hero_videos (title, video_url, poster_url, description, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, videoUrl, posterUrl, description || null, isActive ? 1 : 0, displayOrder]
    );

    const insertResult = result as any;
    return NextResponse.json({
      success: true,
      video: {
        id: insertResult.insertId,
        title,
        videoUrl,
        posterUrl,
        description,
        isActive,
        displayOrder,
      },
    });
  } catch (error: any) {
    console.error('Upload hero video error:', error);
    return NextResponse.json(
      { success: false, error: '비디오 업로드에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
