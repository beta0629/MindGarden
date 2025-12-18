import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 환경 변수에서 관리자 비밀번호 가져오기
const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD || 'admin123';

// 로그인 처리
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      // 인증 토큰 생성 (간단한 토큰)
      const token = Buffer.from(`blog-admin-${Date.now()}`).toString('base64');
      
      // 쿠키에 토큰 저장 (30일 유효)
      const cookieStore = await cookies();
      cookieStore.set('blog_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30일
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 로그아웃 처리
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('blog_admin_token');
  
  return NextResponse.json({ success: true });
}

// 인증 상태 확인
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('blog_admin_token');
  
  return NextResponse.json({ 
    authenticated: !!token 
  });
}

