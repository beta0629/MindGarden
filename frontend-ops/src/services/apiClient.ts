import "server-only";

import { cookies } from "next/headers";
import { getMockResponse } from "@/services/mockApi";
import { HTTP_STATUS_UNAUTHORIZED } from "@/constants/httpStatus";

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
    return getMockResponse<T>({ path, options });
    }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    if (response.status === HTTP_STATUS_UNAUTHORIZED && shouldUseMock(config)) {
      return getMockResponse<T>({ path, options });
    }
    const body = await safeParseJson(response);
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
  if (
    process.env.NEXT_PUBLIC_OPS_API_USE_MOCK === "true" ||
    config.apiToken.includes("placeholder") ||
    config.apiToken === "dummy" ||
    config.apiToken.trim() === "" ||
    !config.apiToken.includes(".")
  ) {
    return true;
  }
  return false;
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "no-body" };
  }
}

