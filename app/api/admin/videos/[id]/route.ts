import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDbConnection } from '@/lib/db';
import { isLikelyVideoFile } from '@/lib/upload-file-types';

const execAsync = promisify(exec);

// 히어로 비디오 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const clientPrecompressed = formData.get('clientPrecompressed') === 'true';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'true';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: '제목이 필요합니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 기존 비디오 정보 조회
    const [existingRows] = await connection.execute(
      `SELECT video_url FROM hero_videos WHERE id = ?`,
      [id]
    );
    const existingVideo = (existingRows as any[])[0];
    if (!existingVideo) {
      return NextResponse.json(
        { success: false, error: '비디오를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let videoUrl = existingVideo.video_url;

    // 새 비디오 파일이 있으면 업로드
    if (file) {
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

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileExtension = 'mp4';
      const fileName = `hero_video_${timestamp}.${fileExtension}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');

      await mkdir(uploadDir, { recursive: true });
      const finalFilePath = join(uploadDir, fileName);

      if (clientPrecompressed) {
        await writeFile(finalFilePath, buffer);
        console.log('Hero video saved as client-precompressed MP4 (skipped server FFmpeg).');
      } else {
        const tempFileName = `temp_${timestamp}_${originalName}`;
        const tempFilePath = join(uploadDir, tempFileName);
        await writeFile(tempFilePath, buffer);

        try {
          await execAsync(
            `ffmpeg -i "${tempFilePath}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -r 30 -movflags +faststart -y "${finalFilePath}"`
          );
          console.log('Video resized successfully with FFmpeg (4K → 1080p).');

          try {
            await unlink(tempFilePath);
          } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
          }
        } catch (ffmpegError: any) {
          console.warn('FFmpeg not available or failed, using original video:', ffmpegError.message);
          await writeFile(finalFilePath, buffer);

          try {
            await unlink(tempFilePath);
          } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
          }
        }
      }

      videoUrl = `/uploads/videos/${fileName}`;

      // 기존 파일 삭제
      if (existingVideo.video_url && existingVideo.video_url.startsWith('/uploads/')) {
        const oldFilePath = join(process.cwd(), 'public', existingVideo.video_url);
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath);
          } catch (unlinkError) {
            console.error('Failed to delete old video file:', unlinkError);
          }
        }
      }
    }

    // DB 업데이트
    await connection.execute(
      `UPDATE hero_videos
       SET title = ?, video_url = ?, description = ?, is_active = ?, display_order = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, videoUrl, description || null, isActive ? 1 : 0, displayOrder, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update hero video error:', error);
    return NextResponse.json(
      { success: false, error: '비디오 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 히어로 비디오 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 기존 비디오 정보 조회
    const [existingRows] = await connection.execute(
      `SELECT video_url FROM hero_videos WHERE id = ?`,
      [id]
    );
    const existingVideo = (existingRows as any[])[0];
    if (!existingVideo) {
      return NextResponse.json(
        { success: false, error: '비디오를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // DB에서 삭제
    await connection.execute(`DELETE FROM hero_videos WHERE id = ?`, [id]);

    // 파일 삭제
    if (existingVideo.video_url && existingVideo.video_url.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', existingVideo.video_url);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (unlinkError) {
          console.error('Failed to delete video file:', unlinkError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete hero video error:', error);
    return NextResponse.json(
      { success: false, error: '비디오 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
