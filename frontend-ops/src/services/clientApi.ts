import notificationManager from "@/utils/notification";

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
  
  // apiBaseUrl이 있으면 그대로 사용, 없으면 상대 경로 사용
  // 상대 경로를 사용하면 같은 도메인의 /api/v1 경로로 요청
  const apiPath = normalizedPath.startsWith("/api/") 
    ? normalizedPath 
    : `/api/v1${normalizedPath}`;
  
  const fullUrl = apiBaseUrl ? `${apiBaseUrl}${apiPath}` : apiPath;

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
    
    // 401 Unauthorized 처리 - 로그인 페이지로 리다이렉트
    if (response.status === 401) {
      const errorMessage = errorData.message || body.message || "인증이 필요합니다. 로그인해주세요.";
      notificationManager.error(errorMessage);
      
      // 쿠키 삭제
      if (typeof document !== "undefined") {
        document.cookie = "ops_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "ops_actor_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "ops_actor_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      
      // 로그인 페이지로 리다이렉트
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
  const cookieString = typeof document !== "undefined" ? document.cookie ?? "" : "";
  const cookieMap = parseCookie(cookieString);

  // 디버깅: 쿠키 파싱 결과 확인 (항상 출력)
  if (typeof window !== "undefined") {
    console.log("[resolveClientRuntimeConfig] 쿠키 파싱:", {
      hasCookieString: !!cookieString,
      cookieStringLength: cookieString.length,
      cookieString: cookieString,
      hasOpsToken: cookieMap.has("ops_token"),
      opsTokenLength: cookieMap.get("ops_token")?.length || 0,
      opsTokenPreview: cookieMap.get("ops_token")?.substring(0, 30) || "없음",
      allCookieKeys: Array.from(cookieMap.keys()),
      allCookieEntries: Array.from(cookieMap.entries()).map(([k, v]) => [k, v.substring(0, 20)])
    });
  }

  const apiToken =
    cookieMap.get("ops_token") ??
    process.env.NEXT_PUBLIC_OPS_API_TOKEN ??
    "";
  const actorId =
    cookieMap.get("ops_actor_id") ??
    process.env.NEXT_PUBLIC_OPS_ACTOR_ID ??
    "";
  const actorRole =
    cookieMap.get("ops_actor_role") ??
    process.env.NEXT_PUBLIC_OPS_ACTOR_ROLE ??
    "HQ_ADMIN";

  // 환경 변수나 쿠키에서 API Base URL 가져오기
  // 로컬 개발 환경에서는 백엔드에 직접 요청 (rewrites는 Authorization 헤더를 전달하지 않음)
  // 개발/운영 환경에서는 상대 경로 사용 (Nginx 프록시)
  const apiBaseUrl =
    ENV_API_BASE_URL || 
    cookieMap.get("ops_api_base_url") || 
    (typeof window !== "undefined" && window.location.hostname === "localhost" 
      ? "http://localhost:8081/api/v1" 
      : "");

  return {
    apiBaseUrl, // 빈 문자열이면 상대 경로 사용
    apiToken,
    actorId,
    actorRole
  };
}

function parseCookie(cookieString: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieString) {
    return map;
  }

  cookieString.split(";").forEach((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) {
      return;
    }
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue.join("="));
    map.set(key, value);
  });

  return map;
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "no-body" };
  }
}

