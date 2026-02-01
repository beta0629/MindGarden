import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import DOMPurify from 'isomorphic-dompurify';

// 후기 목록 조회 (공개용 - 승인된 후기만)
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, author_name, content, created_at, updated_at
       FROM reviews
       WHERE is_approved = 1
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // 전체 개수 조회
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) as total FROM reviews WHERE is_approved = 1`
    );
    const total = (countRows as any[])[0].total;

    const reviews = (rows as any[]).map((row: any) => ({
      id: row.id,
      authorName: row.author_name,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: '후기 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 후기 작성
export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { authorName, content, password } = body;

    // 입력 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '후기 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { success: false, error: '후기 내용이 너무 깁니다. (최대 100,000자)' },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (password.length > 100) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 너무 깁니다.' },
        { status: 400 }
      );
    }

    // XSS 방지: HTML 정화
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style'],
      ALLOW_DATA_ATTR: false,
    });

    // 작성자 이름 검증 및 기본값 설정
    const finalAuthorName = (authorName && authorName.trim()) ? authorName.trim().substring(0, 100) : '익명';

    // 비밀번호 해싱
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // DB에 저장
    connection = await getDbConnection();
    const [result] = await connection.execute(
      `INSERT INTO reviews (author_name, content, password_hash, is_approved)
       VALUES (?, ?, ?, 1)`,
      [finalAuthorName, sanitizedContent, passwordHash]
    );

    const insertResult = result as any;
    return NextResponse.json({
      success: true,
      review: {
        id: insertResult.insertId,
        authorName: finalAuthorName,
        content: sanitizedContent,
      },
      message: '후기가 등록되었습니다.',
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: '후기 등록에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
