import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL =
  process.env.OPS_API_BASE_URL ??
  process.env.NEXT_PUBLIC_OPS_API_BASE_URL ??
  "http://localhost:8080/api/v1";

const COOKIE_SETTINGS = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

export async function POST(request: Request) {
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error(`[Ops Auth] 요청 본문 파싱 실패:`, error);
      return NextResponse.json(
        { message: "요청 데이터를 읽을 수 없습니다." },
        { status: 400 }
      );
    }
    
    const { username, password } = requestBody;

    if (!username || !password) {
      return NextResponse.json(
        { message: "아이디와 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const backendUrl = `${DEFAULT_API_BASE_URL}/ops/auth/login`;
    console.log(`[Ops Auth] 로그인 시도: username=${username}, backend=${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    console.log(`[Ops Auth] 백엔드 응답: status=${backendResponse.status}, ok=${backendResponse.ok}, url=${backendUrl}`);

    let data: any = null;
    try {
      const contentType = backendResponse.headers.get("content-type");
      const contentLength = backendResponse.headers.get("content-length");
      
      console.log(`[Ops Auth] 응답 헤더: contentType=${contentType}, contentLength=${contentLength}`);
      
      if (contentLength !== "0" && contentType?.includes("application/json")) {
        data = await backendResponse.json();
        console.log(`[Ops Auth] 응답 데이터:`, JSON.stringify(data).substring(0, 200));
      }
    } catch (error) {
      console.error(`[Ops Auth] JSON 파싱 실패:`, error);
      data = null;
    }

    if (!backendResponse.ok) {
      // ErrorResponse 또는 ApiResponse 래퍼 처리
      let errorMessage = "로그인에 실패했습니다. 입력 정보를 다시 확인해주세요.";
      
      if (data) {
        // ErrorResponse 형태: { success: false, message: "...", errorCode: "...", status: 401/400/... }
        if (data.success === false && data.message) {
          errorMessage = data.message;
        } 
        // ApiResponse 형태: { success: false, message: "...", error: {...} }
        else if (data.message && !data.errorCode) {
          errorMessage = data.message;
        }
        // 중첩된 error 객체 처리
        else if (data.error && typeof data.error === 'object') {
          if ('message' in data.error) {
            errorMessage = (data.error as { message: string }).message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
        // 문자열 직접 전달
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      console.error(`[Ops Auth] 백엔드 오류: status=${backendResponse.status}, message=${errorMessage}, data=`, JSON.stringify(data));
      
      // 400 Bad Request의 경우 백엔드 응답 상태 그대로 전달
      // 401 Unauthorized는 401로 전달 (로그인 실패)
      const statusCode = backendResponse.status === 401 ? 401 : backendResponse.status;
      
      return NextResponse.json(
        {
          message: errorMessage
        },
        { status: statusCode }
      );
    }

    // ApiResponse 래퍼 처리: { success: true, data: {...} } 형태면 data 추출
    let responseData = data;
    if (data && typeof data === 'object' && 'success' in data && 'data' in data && data.success) {
      responseData = data.data;
      console.log(`[Ops Auth] ApiResponse 래퍼 처리: data=`, responseData);
    }
    
    if (!responseData || !responseData.token) {
      console.error(`[Ops Auth] 토큰 없음: responseData=`, responseData, `original data=`, data);
      return NextResponse.json(
        {
          message: "로그인 응답을 해석할 수 없습니다. 관리자에게 문의하세요."
        },
        { status: 502 }
      );
    }

    const maxAge = 60 * 60; // 1 hour
    const response = NextResponse.json({ success: true });

    response.cookies.set("ops_token", responseData.token, {
      ...COOKIE_SETTINGS,
      maxAge
    });
    response.cookies.set("ops_actor_id", responseData.actorId || username, {
      ...COOKIE_SETTINGS,
      maxAge
    });
    response.cookies.set("ops_actor_role", responseData.actorRole || "HQ_ADMIN", {
      ...COOKIE_SETTINGS,
      maxAge
    });

    console.log(`[Ops Auth] 로그인 성공: actorId=${responseData.actorId || username}, role=${responseData.actorRole || "HQ_ADMIN"}`);

    return response;
  } catch (error: any) {
    console.error(`[Ops Auth] 예외 발생:`, error);
    return NextResponse.json(
      {
        message: `서버 오류가 발생했습니다: ${error?.message || "알 수 없는 오류"}`
      },
      { status: 500 }
    );
  }
}

