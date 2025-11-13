import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL =
  process.env.OPS_API_BASE_URL ??
  process.env.NEXT_PUBLIC_OPS_API_BASE_URL ??
  "http://localhost:7080/api/v1";

const COOKIE_SETTINGS = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "아이디와 비밀번호를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  const backendResponse = await fetch(`${DEFAULT_API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  let data: any = null;
  try {
    if (backendResponse.headers
      .get("content-length") !== "0" &&
      backendResponse.headers.get("content-type")?.includes("application/json")) {
      data = await backendResponse.json();
    }
  } catch (error) {
    data = null;
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        message:
          data?.message ??
          "로그인에 실패했습니다. 입력 정보를 다시 확인해주세요."
      },
      { status: backendResponse.status }
    );
  }

  if (!data || !data.token) {
    return NextResponse.json(
      {
        message: "로그인 응답을 해석할 수 없습니다. 관리자에게 문의하세요."
      },
      { status: 502 }
    );
  }

  const maxAge = 60 * 60; // 1 hour
  const response = NextResponse.json({ success: true });

  response.cookies.set("ops_token", data.token, {
    ...COOKIE_SETTINGS,
    maxAge
  });
  response.cookies.set("ops_actor_id", data.actorId, {
    ...COOKIE_SETTINGS,
    maxAge
  });
  response.cookies.set("ops_actor_role", data.actorRole, {
    ...COOKIE_SETTINGS,
    maxAge
  });

  return response;
}

