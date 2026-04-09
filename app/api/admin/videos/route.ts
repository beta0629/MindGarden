import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDbConnection } from '@/lib/db';
import { isLikelyVideoFile } from '@/lib/upload-file-types';

const execAsync = promisify(exec);

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
      connection.release();
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

    // 파일 크기 확인 (500MB 제한 - 4K 동영상 지원)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '비디오 크기는 500MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    if (!isLikelyVideoFile(file)) {
      return NextResponse.json(
        { success: false, error: '비디오 파일만 업로드 가능합니다. (MOV·MP4 등)' },
        { status: 400 }
      );
    }

    // 파일 읽기
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = 'mp4'; // 항상 MP4로 변환
    const fileName = `hero_video_${timestamp}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');
    
    // 디렉토리 생성
    await mkdir(uploadDir, { recursive: true });

    // 임시 원본 파일 저장
    const tempFileName = `temp_${timestamp}_${originalName}`;
    const tempFilePath = join(uploadDir, tempFileName);
    await writeFile(tempFilePath, buffer);

    // 최종 파일 경로
    const finalFilePath = join(uploadDir, fileName);

    // FFmpeg를 사용하여 비디오 리사이징 (4K → 1080p)
    // FFmpeg가 설치되어 있으면 자동 리사이징, 없으면 원본 사용
    try {
      // FFmpeg 설치 확인 및 리사이징
      await execAsync(
        `ffmpeg -i "${tempFilePath}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -r 30 -movflags +faststart -y "${finalFilePath}"`
      );
      console.log('Video resized successfully with FFmpeg (4K → 1080p).');
      
      // 임시 파일 삭제
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError);
      }
    } catch (ffmpegError: any) {
      console.warn('FFmpeg not available or failed, using original video:', ffmpegError.message);
      // FFmpeg가 없거나 실패하면 원본 파일을 그대로 사용
      await writeFile(finalFilePath, buffer);
      
      // 임시 파일 삭제
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError);
      }
    }

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
      connection.release();
    }
  }
}
