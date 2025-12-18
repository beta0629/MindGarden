import { NextResponse } from 'next/server';

// Chrome DevTools가 자동으로 요청하는 파일
// 404를 방지하기 위해 빈 응답 반환
export async function GET() {
  return NextResponse.json({}, { status: 200 });
}

