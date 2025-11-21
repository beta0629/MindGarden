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

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiToken}`,
    "X-Actor-Id": actorId,
    "X-Actor-Role": actorRole,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers ?? {})
  };

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const body = await safeParseJson(response);
    
    // 403 Forbidden (권한 없음) 처리
    if (response.status === 403) {
      const errorMessage = (body as { message?: string })?.message || "접근 권한이 없습니다.";
      // 공통 알림 표시
      notificationManager.error(errorMessage);
      const error = new Error(errorMessage);
      (error as any).status = 403;
      (error as any).body = body;
      throw error;
    }
    
    // 401 Unauthorized 처리
    if (response.status === 401) {
      const errorMessage = (body as { message?: string })?.message || "인증이 필요합니다.";
      notificationManager.error(errorMessage);
      const error = new Error(errorMessage);
      (error as any).status = 401;
      (error as any).body = body;
      throw error;
    }
    
    // 기타 오류 처리
    const errorMessage = (body as { message?: string })?.message || 
      `API 요청 실패 (${response.status} ${response.statusText})`;
    notificationManager.error(errorMessage);
    
    throw new Error(
      `API 요청 실패 (${response.status} ${response.statusText}): ${JSON.stringify(
        body
      )}`
    );
  }

  return (await response.json()) as T;
}

function resolveClientRuntimeConfig(): ClientRuntimeConfig {
  const cookieMap = parseCookie(
    typeof document !== "undefined" ? document.cookie ?? "" : ""
  );

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

  const apiBaseUrl =
    ENV_API_BASE_URL || cookieMap.get("ops_api_base_url") || "";

  if (!apiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_OPS_API_BASE_URL가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
  }

  return {
    apiBaseUrl,
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

