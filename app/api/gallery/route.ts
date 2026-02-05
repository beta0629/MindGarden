import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// 갤러리 이미지 목록 조회
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true'; // 관리자용: 모든 이미지 조회

    connection = await getDbConnection();

    const category = searchParams.get('category'); // 카테고리 필터링
    
    let query = `SELECT id, image_url, alt_text, category, display_order, is_active 
                 FROM gallery_images`;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (!all) {
      conditions.push('is_active = 1');
    }
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY display_order ASC, created_at ASC`;

    const [rows] = await connection.execute(query, params);
    const imageRows = rows as any[];
    
    console.log('Gallery query result:', {
      rowCount: imageRows.length,
      rows: imageRows,
      sample: imageRows[0],
    });

    if (all) {
      // 관리자용: 전체 정보 반환
      const images = imageRows.map((row: any) => ({
        id: row.id,
        imageUrl: row.image_url,
        altText: row.alt_text,
        category: row.category,
        displayOrder: row.display_order,
        isActive: row.is_active === 1,
      }));
      
      console.log('Returning images for admin:', images.length);
      
      return NextResponse.json({
        success: true,
        images: images,
      });
    } else {
      // 일반용: 활성화된 이미지만 반환
      const images = (rows as any[]).map((row: any) => ({
        id: row.id,
        url: row.image_url,
        alt: row.alt_text || '갤러리 이미지',
        category: row.category,
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

// 갤러리 이미지 추가 (관리자용) - 파일 업로드 및 자동 리사이징
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    // 인증 확인
    const authCookie = request.cookies.get('blog_admin_token');
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type');
    
    // FormData로 파일 업로드인 경우
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File;
      const altText = formData.get('altText') as string | null;
      const category = formData.get('category') as string | null;
      const displayOrder = parseInt(formData.get('displayOrder') as string || '0', 10);

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

      // 파일 읽기
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 이미지 자동 리사이징 (최대 1920x1080, 품질 90%)
      // 동적 import로 sharp 로드 (빌드 타임 오류 방지)
      let resizedBuffer: Buffer;
      try {
        const sharp = (await import('sharp')).default;
        resizedBuffer = await sharp(buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 90 })
          .toBuffer();
      } catch (sharpError: any) {
        console.error('Sharp import/resize error:', sharpError);
        // sharp가 실패하면 원본 이미지를 그대로 사용 (클라이언트에서 이미 리사이징했을 수 있음)
        console.warn('Using original image buffer (sharp unavailable)');
        resizedBuffer = buffer;
      }

      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `gallery_${timestamp}_${originalName.replace(/\.[^.]+$/, '.jpg')}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery');
      
      // 디렉토리 생성
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, resizedBuffer);

      // URL 생성 (Next.js API Route를 통해 서빙)
      const imageUrl = `/uploads/gallery/${fileName}`;

      // DB에 저장
      connection = await getDbConnection();
      const [result] = await connection.execute(
        `INSERT INTO gallery_images (image_url, alt_text, category, display_order, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [imageUrl, altText || null, category || null, displayOrder]
      );

      return NextResponse.json({
        success: true,
        id: (result as any).insertId,
        imageUrl,
        url: imageUrl,
        message: '갤러리 이미지가 추가되었습니다.',
      });
    } else {
      // JSON으로 이미지 URL만 전달하는 경우 (기존 방식 지원)
      const body = await request.json();
      const { imageUrl, altText, category, displayOrder = 0 } = body;

      if (!imageUrl) {
        return NextResponse.json(
          { success: false, error: '이미지 URL은 필수입니다.' },
          { status: 400 }
        );
      }

      connection = await getDbConnection();

      const [result] = await connection.execute(
        `INSERT INTO gallery_images (image_url, alt_text, category, display_order, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [imageUrl, altText || null, category || null, displayOrder]
      );

      return NextResponse.json({
        success: true,
        id: (result as any).insertId,
        message: '갤러리 이미지가 추가되었습니다.',
      });
    }
  } catch (error: any) {
    console.error('Add gallery image error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
    });
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

