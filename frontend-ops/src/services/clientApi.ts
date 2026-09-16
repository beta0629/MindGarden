import notificationManager from "@/utils/notification";
import {
  clearOpsAuthSession,
  getOpsAuthSession
} from "@/utils/opsAuthSession";

type ClientRuntimeConfig = {
  apiBaseUrl: string;
  apiToken: string;
  actorId: string;
  actorRole: string;
};

const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_OPS_API_BASE_URL ?? "";

export async function clientApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiBaseUrl, apiToken, actorId, actorRole } =
    resolveClientRuntimeConfig();

  // 토큰이 없으면 에러 로그 출력
  if (!apiToken || apiToken.trim() === "") {
    console.error("[clientApiFetch] 토큰이 없습니다:", {
      path,
      apiToken: apiToken ? "존재하지만 빈 문자열" : "null/undefined",
      cookie: typeof document !== "undefined" ? document.cookie : "N/A",
      actorId,
      actorRole
    });
  } else {
    console.log("[clientApiFetch] 토큰 있음:", {
      path,
      tokenLength: apiToken.length,
      tokenPreview: apiToken.substring(0, 30) + "...",
      actorId,
      actorRole
    });
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiToken}`,
    "X-Actor-Id": actorId,
    "X-Actor-Role": actorRole,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers ?? {})
  };

  // path가 이미 /api/로 시작하는지 확인
  // path가 /로 시작하지 않으면 / 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // apiBaseUrl이 있으면 path를 그대로 붙임 (apiBaseUrl에 이미 /api/v1 포함)
  // apiBaseUrl이 없으면 상대 경로 사용 (같은 도메인의 /api/v1 경로로 요청)
  const fullUrl = apiBaseUrl 
    ? `${apiBaseUrl}${normalizedPath}` 
    : (normalizedPath.startsWith("/api/") ? normalizedPath : `/api/v1${normalizedPath}`);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include" // 쿠키 포함 (SameSite=Lax 쿠키 전송)
  });

  const jsonData = await safeParseJson(response);
  
  if (!response.ok) {
    // ApiResponse 래퍼 처리
    const body = (jsonData as { success?: boolean; data?: any; error?: any; message?: string }) || jsonData;
    const errorData = body.error || body;
    
    // 403 Forbidden (권한 없음) 처리
    // 403은 권한 문제이므로 로그인 페이지로 리다이렉트하지 않음
    // 사용자는 이미 로그인되어 있지만 해당 리소스에 접근 권한이 없는 경우
    if (response.status === 403) {
      const errorMessage = errorData.message || body.message || "접근 권한이 없습니다.";
      // 공통 알림 표시
      notificationManager.error(errorMessage);
      const error = new Error(errorMessage);
      (error as any).status = 403;
      (error as any).body = body;
      // 403 오류는 리다이렉트하지 않고 에러만 throw
      throw error;
    }
    
    // 401 Unauthorized 처리
    // TENANT_ID_NOT_SET 등 테넌트 컨텍스트 오류는 인증 만료가 아니므로 세션을 유지한다
    if (response.status === 401) {
      const errorMessage = errorData.message || body.message || "인증이 필요합니다. 로그인해주세요.";
      notificationManager.error(errorMessage);

      // TENANT_ID_NOT_SET 등은 세션 유지 (confirmed wipe hole)
      if (isTenantContextUnauthorized(body, errorData, errorMessage)) {
        const error = new Error(errorMessage);
        (error as any).status = 401;
        (error as any).body = body;
        throw error;
      }

      // 실제 인증 실패만 세션 삭제 후 로그인 리다이렉트
      clearOpsAuthSession();

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const loginUrl = currentPath !== "/auth/login"
          ? `/auth/login?redirect=${encodeURIComponent(currentPath)}`
          : "/auth/login";
        window.location.href = loginUrl;
      }

      const error = new Error(errorMessage);
      (error as any).status = 401;
      (error as any).body = body;
      throw error;
    }
    
    // 기타 오류 처리
    const errorMessage = errorData.message || body.message || 
      `API 요청 실패 (${response.status} ${response.statusText})`;
    notificationManager.error(errorMessage);
    
    throw new Error(
      `API 요청 실패 (${response.status} ${response.statusText}): ${JSON.stringify(
        body
      )}`
    );
  }

  // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
  if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
    return (jsonData as { success: boolean; data: T }).data;
  }
  
  // ApiResponse 래퍼가 없으면 그대로 반환
  return jsonData as T;
}

function resolveClientRuntimeConfig(): ClientRuntimeConfig {
  const session = getOpsAuthSession();

  if (typeof window !== "undefined") {
    console.log("[resolveClientRuntimeConfig] Ops 세션:", {
      hasOpsToken: !!session.token,
      opsTokenLength: session.token.length,
      opsTokenPreview: session.token.substring(0, 30) || "없음",
      actorId: session.actorId || "없음",
      actorRole: session.actorRole || "없음"
    });
  }

  const apiToken =
    session.token ||
    process.env.NEXT_PUBLIC_OPS_API_TOKEN ||
    "";
  const actorId =
    session.actorId ||
    process.env.NEXT_PUBLIC_OPS_ACTOR_ID ||
    "";
  const actorRole =
    session.actorRole ||
    process.env.NEXT_PUBLIC_OPS_ACTOR_ROLE ||
    "HQ_ADMIN";

  // 환경 변수에서 API Base URL 가져오기 (필수)
  const apiBaseUrl = ENV_API_BASE_URL || "";

  return {
    apiBaseUrl, // 빈 문자열이면 상대 경로 사용
    apiToken,
    actorId,
    actorRole
  };
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "no-body" };
  }
}

/**
 * 401이 인증 만료가 아니라 테넌트 컨텍스트 미설정으로 매핑된 경우인지 판별한다.
 * (GlobalExceptionHandler TENANT_ID_NOT_SET → 세션 유지, 로그인 바운스 방지)
 */
function isTenantContextUnauthorized(
  body: { errorCode?: string; error?: { errorCode?: string }; message?: string } | null | undefined,
  errorData: { errorCode?: string; message?: string } | null | undefined,
  errorMessage: string
): boolean {
  const codes = [
    body?.errorCode,
    body?.error?.errorCode,
    errorData?.errorCode
  ]
    .filter((code): code is string => typeof code === "string")
    .map((code) => code.toUpperCase());

  if (codes.some((code) => code === "TENANT_ID_NOT_SET")) {
    return true;
  }

  const message = (errorMessage || body?.message || errorData?.message || "").toLowerCase();
  return (
    message.includes("tenant_id_not_set") ||
    message.includes("tenant id is not set") ||
    message.includes("tenant id is not set in current context")
  );
}

