/**
 * 인증 API 서비스
 * 로그인/로그아웃 등 인증 관련 API 호출
 * 표준화된 API 호출 패턴 사용
 */

import { OPS_API_PATHS } from "@/constants/api";
import {
  clearOpsAuthSession,
  setOpsAuthSession
} from "@/utils/opsAuthSession";

/**
 * 로그인 API 호출
 * 로그인은 토큰이 없으므로 별도 처리
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  actorId: string;
  actorRole: string;
  expiresAt: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  // 환경 변수에서 API Base URL 가져오기 (필수)
  // 로컬, 개발, 운영 모두 환경 변수로 설정
  const apiBaseUrl = process.env.NEXT_PUBLIC_OPS_API_BASE_URL;
  
  console.log("[authApi.login] 환경 변수 확인:", {
    hasApiBaseUrl: !!apiBaseUrl,
    apiBaseUrl: apiBaseUrl || "undefined",
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith("NEXT_PUBLIC_"))
  });
  
  if (!apiBaseUrl) {
    const errorMessage = "NEXT_PUBLIC_OPS_API_BASE_URL 환경 변수가 설정되지 않았습니다. 빌드 시 환경 변수를 설정해주세요.";
    console.error("[authApi.login] 환경 변수 오류:", errorMessage);
    throw new Error(errorMessage);
  }
  
  const apiPath = `${apiBaseUrl}/ops/auth/login`;
  
  // 백엔드 API는 userId를 기대하므로 변환
  const requestBody = {
    userId: request.username,
    password: request.password
  };
  
  console.log("[authApi.login] 로그인 API 호출:", { apiPath, apiBaseUrl, requestBody: { userId: requestBody.userId, password: "***" } });
  
  const response = await fetch(apiPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(requestBody),
    credentials: "include" // 쿠키 포함
  });

  if (!response.ok) {
    let errorMessage = "로그인에 실패했습니다. 입력 정보를 다시 확인하세요.";
    
    try {
      const body = await response.json();
      errorMessage = body?.message || body?.error?.message || errorMessage;
    } catch (e) {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const body = await response.json();
  
  // 응답 형식: { success: true, data: LoginResponse } 또는 직접 LoginResponse
  const responseData = body?.data || body;
  
  if (!responseData || !responseData.token) {
    throw new Error("로그인 응답에 토큰이 없습니다.");
  }
  
  // static export(prod)에서는 BFF Set-Cookie가 없으므로 FE가 cookie+localStorage로 유지
  if (typeof document !== "undefined") {
    const sessionResult = setOpsAuthSession({
      token: responseData.token,
      actorId: responseData.actorId || "",
      actorRole: responseData.actorRole || "HQ_ADMIN",
      maxAgeSeconds: 3600
    });

    console.log("[authApi.login] Ops 인증 세션 설정:", {
      cookieTokenPresent: sessionResult.cookieTokenPresent,
      storagePresent: sessionResult.storagePresent,
      isHttps: window.location.protocol === "https:"
    });

    if (!sessionResult.cookieTokenPresent && !sessionResult.storagePresent) {
      console.error("[authApi.login] 세션 저장 실패 - cookie/localStorage 모두 비어 있음");
      throw new Error("인증 세션 저장에 실패했습니다. 브라우저 설정을 확인해주세요.");
    }
  }
  
  return responseData as LoginResponse;
}

/**
 * 로그아웃 API 호출
 * (현재는 클라이언트 쪽 세션 삭제만 수행)
 */
export async function logout(): Promise<void> {
  // 환경 변수에서 API Base URL 가져오기 (필수)
  const apiBaseUrl = process.env.NEXT_PUBLIC_OPS_API_BASE_URL;
  
  if (apiBaseUrl) {
    const apiPath = `${apiBaseUrl}${OPS_API_PATHS.AUTH.LOGOUT}`;
    
    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "include" // 쿠키 포함
      });
      
      // 로그아웃 API가 없어도 클라이언트 쪽 세션 삭제는 수행
      if (!response.ok && response.status !== 404) {
        console.warn("[authApi.logout] 로그아웃 API 호출 실패:", response.status);
      }
    } catch (error) {
      console.warn("[authApi.logout] 로그아웃 API 호출 중 오류:", error);
      // 로그아웃 API 실패해도 클라이언트 쪽 세션 삭제는 수행
    }
  } else {
    console.warn("[authApi.logout] NEXT_PUBLIC_OPS_API_BASE_URL 환경 변수가 설정되지 않았습니다. 로그아웃 API 호출을 건너뜁니다.");
  }
  
  clearOpsAuthSession();
}
