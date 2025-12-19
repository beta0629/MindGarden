import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 블로그 포스트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  
  try {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 포스트 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 관리자 인증 확인 (쿠키에서)
    const cookies = request.cookies;
    const authCookie = cookies.get('blog_admin_token');
    const isAdmin = authCookie && authCookie.value;

    // 관리자는 모든 상태 조회 가능, 일반 사용자는 published만 조회
    let query = `SELECT id, title, content, summary, thumbnail_image_url, status, 
                        published_at, created_at, is_homepage_only
                 FROM blog_posts
                 WHERE id = ?`;
    
    if (!isAdmin) {
      query += ` AND status = "published"`;
    }

    const [rows] = await connection.execute(query, [postId]);

    const posts = rows as any[];
    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const row = posts[0];

    // 관련 이미지 조회
    const [imageRows] = await connection.execute(
      `SELECT id, image_url, alt_text, display_order
       FROM blog_images
       WHERE post_id = ?
       ORDER BY display_order ASC, created_at ASC`,
      [postId]
    );

    const post = {
      id: row.id,
      title: row.title,
      content: row.content,
      summary: row.summary,
      thumbnailImageUrl: row.thumbnail_image_url,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      isHomepageOnly: row.is_homepage_only === 1,
      images: (imageRows as any[]).map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        displayOrder: img.display_order,
      })),
    };

    return NextResponse.json({
      success: true,
      ...post,
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 포스트를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 블로그 포스트 수정
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

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 포스트 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, summary, thumbnailImageUrl, status, isHomepageOnly } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 기존 포스트 확인
    const [existingRows] = await connection.execute(
      `SELECT id, status, published_at FROM blog_posts WHERE id = ?`,
      [postId]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existing = (existingRows as any[])[0];
    let publishedAt = existing.published_at;

    // 상태가 draft에서 published로 변경되면 published_at 업데이트
    if (existing.status === 'draft' && status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }

    await connection.execute(
      `UPDATE blog_posts 
       SET title = ?, content = ?, summary = ?, thumbnail_image_url = ?, 
           status = ?, published_at = ?, is_homepage_only = ?
       WHERE id = ?`,
      [
        title,
        content,
        summary || null,
        thumbnailImageUrl || null,
        status,
        publishedAt,
        isHomepageOnly ? 1 : 0,
        postId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: '블로그 포스트가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 포스트 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 블로그 포스트 삭제
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

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 포스트 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 관련 이미지 삭제
    await connection.execute(
      `DELETE FROM blog_images WHERE post_id = ?`,
      [postId]
    );

    // 포스트 삭제
    await connection.execute(
      `DELETE FROM blog_posts WHERE id = ?`,
      [postId]
    );

    return NextResponse.json({
      success: true,
      message: '블로그 포스트가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 포스트 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

