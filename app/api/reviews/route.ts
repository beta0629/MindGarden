import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import DOMPurify from 'isomorphic-dompurify';

// 후기 목록 조회 (공개용 - 승인된 후기만)
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    connection = await getDbConnection();
    // MySQL2에서 LIMIT/OFFSET은 플레이스홀더 대신 직접 값을 사용 (SQL 인젝션 방지를 위해 숫자로 변환)
    const safeLimit = Math.max(1, Math.min(100, limit)); // 1-100 사이로 제한
    const safeOffset = Math.max(0, offset); // 0 이상으로 제한
    const [rows] = await connection.execute(
      `SELECT id, author_name, content, tags, ratings, created_at, updated_at
       FROM homepage_reviews
       WHERE is_approved = 1
       ORDER BY created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    // 전체 개수 조회
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) as total FROM homepage_reviews WHERE is_approved = 1`
    );
    const total = (countRows as any[])[0].total;

    const reviews = (rows as any[]).map((row: any) => {
      let tags = [];
      let ratings = null;
      
      try {
        tags = row.tags ? JSON.parse(row.tags) : [];
      } catch (e) {
        tags = [];
      }
      
      try {
        ratings = row.ratings ? JSON.parse(row.ratings) : null;
      } catch (e) {
        ratings = null;
      }
      
      return {
        id: row.id,
        authorName: row.author_name,
        content: row.content,
        tags,
        ratings,
        likeCount: row.like_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sql: error.sql,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: '후기 목록을 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
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
    const { authorName, content, password, tags, ratings } = body;

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

    // tags와 ratings를 JSON 문자열로 변환
    const tagsJson = Array.isArray(tags) && tags.length > 0
      ? JSON.stringify(tags)
      : null;
    
    const ratingsJson = ratings && typeof ratings === 'object'
      ? JSON.stringify(ratings)
      : null;

    // DB에 저장
    connection = await getDbConnection();
    const [result] = await connection.execute(
      `INSERT INTO homepage_reviews (author_name, content, password_hash, tags, ratings, is_approved)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [finalAuthorName, sanitizedContent, passwordHash, tagsJson, ratingsJson]
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
