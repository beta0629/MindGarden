import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import DOMPurify from 'isomorphic-dompurify';

// 단건 후기 조회 (승인된 글만, 공개용)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, author_name, content, tags, ratings, COALESCE(like_count, 0) as like_count, created_at, updated_at
       FROM homepage_reviews WHERE id = ? AND is_approved = 1`,
      [id]
    );
    const row = (rows as any[])[0];
    if (!row) {
      return NextResponse.json(
        { success: false, error: '후기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let tags: string[] = [];
    let ratings: Record<string, unknown> | null = null;
    try {
      tags = row.tags ? JSON.parse(row.tags) : [];
    } catch {
      tags = [];
    }
    try {
      ratings = row.ratings ? JSON.parse(row.ratings) : null;
    } catch {
      ratings = null;
    }

    return NextResponse.json({
      success: true,
      review: {
        id: row.id,
        authorName: row.author_name,
        content: row.content,
        tags,
        ratings,
        likeCount: row.like_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Get review error:', error);
    return NextResponse.json(
      { success: false, error: '후기를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 후기 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, password } = body;

    // 입력 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '후기 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 기존 후기 조회
    const [existingRows] = await connection.execute(
      `SELECT password_hash FROM homepage_reviews WHERE id = ?`,
      [id]
    );
    const existingReview = (existingRows as any[])[0];

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '후기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, existingReview.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // XSS 방지: HTML 정화
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style'],
      ALLOW_DATA_ATTR: false,
    });

    // 후기 수정
    await connection.execute(
      `UPDATE homepage_reviews SET content = ?, updated_at = NOW() WHERE id = ?`,
      [sanitizedContent, id]
    );

    return NextResponse.json({ success: true, message: '후기가 수정되었습니다.' });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { success: false, error: '후기 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 후기 삭제 (비밀번호 인증)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 기존 후기 조회
    const [existingRows] = await connection.execute(
      `SELECT password_hash FROM homepage_reviews WHERE id = ?`,
      [id]
    );
    const existingReview = (existingRows as any[])[0];

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '후기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, existingReview.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 후기 삭제
    await connection.execute(`DELETE FROM homepage_reviews WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: '후기가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: '후기 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
