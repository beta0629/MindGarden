import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 블로그 포스트 목록 조회
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))); // 최대 100, 최소 1
    const homepageOnly = searchParams.get('homepageOnly') === 'true';
    const includeAllStatus = searchParams.get('includeAllStatus') === 'true'; // 관리자용: 모든 상태 조회
    const offset = (page - 1) * limit;

    connection = await getDbConnection();

    // 테이블이 없을 수 있으므로 try-catch로 처리
    let query = `SELECT id, title, content, summary, thumbnail_image_url, status, 
                        published_at, created_at, is_homepage_only
                 FROM blog_posts`;
    
    const conditions: string[] = [];
    // 홈페이지 블로그는 tenant_id와 무관하게 조회
    if (homepageOnly) {
      conditions.push('is_homepage_only = 1');
    }
    // 관리자는 모든 상태 조회 가능, 일반 사용자는 published 상태만 조회
    if (!includeAllStatus) {
      conditions.push('status = "published"');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // LIMIT와 OFFSET은 플레이스홀더를 사용할 수 없으므로 직접 값을 넣어야 함
    // 값은 이미 검증되었으므로 안전함
    query += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    let rows: any[] = [];
    let total = 0;

    try {
      console.log('========== 블로그 포스트 조회 ==========');
      console.log('Query:', query);
      console.log('Conditions:', conditions);
      console.log('includeAllStatus:', includeAllStatus);
      
      const [queryRows] = await connection.execute(query);
      rows = queryRows as any[];
      console.log('Query result count:', rows.length);

      // 전체 개수 조회
      let countQuery = `SELECT COUNT(*) as total FROM blog_posts`;
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      const [countRows] = await connection.execute(countQuery);
      total = (countRows as any[])[0]?.total || 0;
      console.log('Total count:', total);
      console.log('==========================================');
    } catch (queryError: any) {
      // 테이블이 없거나 쿼리 오류인 경우 빈 배열 반환
      if (queryError?.code === 'ER_NO_SUCH_TABLE' || queryError?.message?.includes('doesn\'t exist')) {
        console.warn('blog_posts table does not exist, returning empty array');
        return NextResponse.json({
          success: true,
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
      // 다른 오류는 다시 throw
      throw queryError;
    }

    const posts = (rows as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      summary: row.summary,
      thumbnailImageUrl: row.thumbnail_image_url,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      isHomepageOnly: row.is_homepage_only === 1,
    }));

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    // 상세한 에러 로깅
    console.error('========== 블로그 포스트 조회 에러 ==========');
    console.error('에러 메시지:', error?.message);
    console.error('에러 코드:', error?.code);
    console.error('SQL 메시지:', error?.sqlMessage);
    console.error('에러 스택:', error?.stack);
    console.error('전체 에러 객체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('==========================================');
    
    const errorMessage = error?.message || '블로그 포스트를 불러오는데 실패했습니다.';
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: error?.message,
          code: error?.code,
          sqlMessage: error?.sqlMessage,
          sqlState: error?.sqlState,
          errno: error?.errno,
        }
      : undefined;
    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 블로그 포스트 작성
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

    const body = await request.json();
    const { title, content, summary, thumbnailImageUrl, status = 'draft', isHomepageOnly = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const publishedAt = status === 'published' ? new Date() : null;

    const [result] = await connection.execute(
      `INSERT INTO blog_posts (title, content, summary, thumbnail_image_url, status, published_at, is_homepage_only)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, content, summary || null, thumbnailImageUrl || null, status, publishedAt, isHomepageOnly ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: '블로그 포스트가 작성되었습니다.',
    });
  } catch (error: any) {
    console.error('========== 블로그 포스트 생성 에러 ==========');
    console.error('에러 메시지:', error?.message);
    console.error('에러 코드:', error?.code);
    console.error('SQL 메시지:', error?.sqlMessage);
    console.error('에러 스택:', error?.stack);
    console.error('전체 에러 객체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('==========================================');

    const errorMessage = error?.message || '블로그 포스트 작성에 실패했습니다.';
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: error?.message,
          code: error?.code,
          sqlMessage: error?.sqlMessage,
          stack: error?.stack,
        }
      : undefined;
    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

