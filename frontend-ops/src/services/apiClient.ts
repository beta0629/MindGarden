import "server-only";

import { cookies } from "next/headers";
import { getMockResponse } from "@/services/mockApi";
import { HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN } from "@/constants/httpStatus";
import notificationManager from "@/utils/notification";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

type ServerRuntimeConfig = {
  apiBaseUrl: string;
  apiToken: string;
  actorId: string;
  actorRole: string;
};

const ENV_API_BASE_URL =
  process.env.OPS_API_BASE_URL ?? process.env.NEXT_PUBLIC_OPS_API_BASE_URL;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = resolveServerRuntimeConfig();
  const url = `${config.apiBaseUrl}${path}`;

  const headers: HeadersInit = {
    ...DEFAULT_HEADERS,
    ...options.headers,
    Authorization: `Bearer ${config.apiToken}`,
    "X-Actor-Id": config.actorId,
    "X-Actor-Role": config.actorRole
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  if (!("cache" in options)) {
    fetchOptions.cache = "no-store";
  }

  if (shouldUseMock(config)) {
    console.log("[apiFetch] Mock API 사용:", { path, url, reason: "shouldUseMock=true" });
    return getMockResponse<T>({ path, options });
  }

  console.log("[apiFetch] 실제 API 호출:", { url, path, apiBaseUrl: config.apiBaseUrl });
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    if (response.status === HTTP_STATUS_UNAUTHORIZED && shouldUseMock(config)) {
      return getMockResponse<T>({ path, options });
    }
    const body = await safeParseJson(response);
    
    // 403 Forbidden (권한 없음) 처리
    if (response.status === HTTP_STATUS_FORBIDDEN) {
      const errorMessage = (body as { message?: string })?.message || "접근 권한이 없습니다.";
      // 서버 사이드에서는 알림을 표시할 수 없으므로 에러만 throw
      const error = new Error(errorMessage);
      (error as any).status = HTTP_STATUS_FORBIDDEN;
      (error as any).body = body;
      throw error;
    }
    
    // 404 Not Found 처리
    if (response.status === 404) {
      const bodyMessage = (body as { message?: string })?.message;
      // "no-body"인 경우 더 명확한 메시지 제공
      const errorMessage = bodyMessage && bodyMessage !== "no-body"
        ? bodyMessage
        : `API 엔드포인트를 찾을 수 없습니다: ${url}`;
      const error = new Error(errorMessage);
      (error as any).status = 404;
      (error as any).body = body;
      (error as any).url = url;
      (error as any).path = path;
      throw error;
    }
    
    throw new Error(
      `API 요청 실패 (${response.status} ${response.statusText}): ${JSON.stringify(
        body
      )}`
    );
  }

  return (await response.json()) as T;
}

function resolveServerRuntimeConfig(): ServerRuntimeConfig {
  const cookieStore = cookies();
  const apiBaseUrl = ENV_API_BASE_URL ?? "";
  if (!apiBaseUrl) {
    throw new Error("OPS API Base URL이 설정되지 않았습니다.");
  }
  const apiToken =
    cookieStore.get("ops_token")?.value ??
    process.env.NEXT_PUBLIC_OPS_API_TOKEN ??
    "";
  const actorId =
    cookieStore.get("ops_actor_id")?.value ??
    process.env.NEXT_PUBLIC_OPS_ACTOR_ID ??
    "";
  const actorRole =
    cookieStore.get("ops_actor_role")?.value ??
    process.env.NEXT_PUBLIC_OPS_ACTOR_ROLE ??
    "HQ_ADMIN";

  return {
    apiBaseUrl,
    apiToken,
    actorId,
    actorRole
  };
}

function shouldUseMock(config: ServerRuntimeConfig): boolean {
  const useMock = 
    process.env.NEXT_PUBLIC_OPS_API_USE_MOCK === "true" ||
    config.apiToken.includes("placeholder") ||
    config.apiToken === "dummy" ||
    config.apiToken.trim() === "" ||
    !config.apiToken.includes(".");
  
  if (useMock) {
    console.log("[shouldUseMock] Mock 사용 결정:", {
      NEXT_PUBLIC_OPS_API_USE_MOCK: process.env.NEXT_PUBLIC_OPS_API_USE_MOCK,
      apiTokenLength: config.apiToken.length,
      apiTokenPreview: config.apiToken.substring(0, 20) + "...",
      apiBaseUrl: config.apiBaseUrl
    });
  }
  
  return useMock;
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "no-body" };
  }
}

