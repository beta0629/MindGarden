import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

// 관리자 인증 확인
function checkAuth(request: NextRequest) {
  const cookies = request.cookies;
  const authCookie = cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

// 팝업 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    connection = await getDbConnection();

    const [rows] = await connection.execute(
      `SELECT id, title, content, image_url, link_url, start_datetime, end_datetime, is_active, priority, created_at, updated_at
       FROM popups
       ORDER BY created_at DESC`
    );

    const popups = (rows as any[]).map((row: any) => {
      // 기존 image_url이 있으면 content에 이미지 태그로 추가 (호환성)
      let content = row.content || '';
      if (row.image_url && !content.includes('<img')) {
        content = `<img src="${row.image_url}" alt="${row.title}" style="max-width: 100%; height: auto;" />${content ? '<br/><br/>' + content : ''}`;
      }
      
      return {
        id: row.id,
        title: row.title,
        content: content,
        imageUrl: null, // 더 이상 사용하지 않음
        linkUrl: row.link_url,
        startDatetime: row.start_datetime,
        endDatetime: row.end_datetime,
        isActive: row.is_active,
        priority: row.priority,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ success: true, popups });
  } catch (error: any) {
    console.error('Get popups error:', error);
    const errorMessage = error?.message || '알 수 없는 오류';
    const errorCode = error?.code || 'UNKNOWN';
    console.error('Error details:', { message: errorMessage, code: errorCode, stack: error?.stack });
    return NextResponse.json(
      { success: false, error: `팝업 목록을 불러오는데 실패했습니다: ${errorMessage} (${errorCode})` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 팝업 생성
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let connection;
  
  try {
    const body = await request.json();
    const {
      title,
      content,
      linkUrl,
      startDatetime,
      endDatetime,
      isActive = true,
      priority = 0,
    } = body;

    // 필수 필드 검증
    if (!title || !startDatetime || !endDatetime) {
      return NextResponse.json(
        { success: false, error: '제목, 시작일시, 종료일시는 필수입니다.' },
        { status: 400 }
      );
    }

    // 날짜 검증
    const startDate = new Date(startDatetime);
    const endDate = new Date(endDatetime);
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: '종료일시는 시작일시보다 이후여야 합니다.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const [result] = await connection.execute(
      `INSERT INTO popups (title, content, image_url, link_url, start_datetime, end_datetime, is_active, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content || null,
        null, // image_url은 더 이상 사용하지 않음 (호환성을 위해 null 저장)
        linkUrl || null,
        startDatetime,
        endDatetime,
        isActive ? 1 : 0,
        priority || 0,
      ]
    );

    const insertResult = result as any;
    return NextResponse.json({
      success: true,
      popup: {
        id: insertResult.insertId,
        title,
        content,
        linkUrl,
        startDatetime,
        endDatetime,
        isActive,
        priority,
      },
    });
  } catch (error: any) {
    console.error('Create popup error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });
    const errorMessage = error?.message || error?.sqlMessage || '알 수 없는 오류';
    return NextResponse.json(
      { success: false, error: `팝업 생성에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
