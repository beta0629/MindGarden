/**
 * Ops Portal 인증 세션 단일 소스.
 * static export(prod)에서는 BFF/middleware가 없으므로 FE가 cookie + localStorage로 유지한다.
 */

export const OPS_AUTH_COOKIE_TOKEN = "ops_token";
export const OPS_AUTH_COOKIE_ACTOR_ID = "ops_actor_id";
export const OPS_AUTH_COOKIE_ACTOR_ROLE = "ops_actor_role";
export const OPS_AUTH_MARKER_COOKIE = "ops_auth";

/** ~4KB 브라우저 쿠키 한도 대비 여유를 둔 인코딩 토큰 쿠키 예산 */
export const COOKIE_BYTE_BUDGET = 3500;

const DEFAULT_MAX_AGE_SECONDS = 3600;
const EXPIRED_COOKIE = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

export type OpsAuthSession = {
  token: string;
  actorId: string;
  actorRole: string;
};

export type SetOpsAuthSessionInput = OpsAuthSession & {
  maxAgeSeconds?: number;
};

export type SetOpsAuthSessionResult = {
  cookieTokenPresent: boolean;
  storagePresent: boolean;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function buildCookieOptions(maxAgeSeconds: number): string {
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "samesite=lax",
    ...(isHttps ? ["secure"] : [])
  ];
  return parts.join("; ");
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${name}=${value}; ${buildCookieOptions(maxAgeSeconds)}`;
}

function expireCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${name}=; path=/; ${EXPIRED_COOKIE}`;
}

function parseCookieMap(cookieString: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieString) {
    return map;
  }

  cookieString.split(";").forEach((entry) => {
    const [rawKey, ...rawValueParts] = entry.trim().split("=");
    if (!rawKey) {
      return;
    }
    try {
      const key = decodeURIComponent(rawKey);
      const rawValue = rawValueParts.join("=");
      const value = rawValue ? decodeURIComponent(rawValue) : "";
      map.set(key, value);
    } catch {
      map.set(rawKey, rawValueParts.join("="));
    }
  });

  return map;
}

function readStorage(key: string): string {
  if (!isBrowser()) {
    return "";
  }
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(key: string, value: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(key: string): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // private mode 등 — 무시
  }
}

function byteLengthUtf8(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return unescape(encodeURIComponent(value)).length;
}

/**
 * 로그인 응답을 cookie + localStorage에 기록한다.
 * 인코딩 토큰이 COOKIE_BYTE_BUDGET을 넘으면 토큰 쿠키 대신 ops_auth=1 마커만 둔다.
 */
export function setOpsAuthSession(
  input: SetOpsAuthSessionInput
): SetOpsAuthSessionResult {
  const token = (input.token || "").trim();
  const actorId = input.actorId || "";
  const actorRole = input.actorRole || "HQ_ADMIN";
  const maxAgeSeconds = input.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;

  if (!isBrowser() || !token) {
    return { cookieTokenPresent: false, storagePresent: false };
  }

  const storageTokenOk = writeStorage(OPS_AUTH_COOKIE_TOKEN, token);
  const storageActorIdOk = writeStorage(OPS_AUTH_COOKIE_ACTOR_ID, actorId);
  const storageActorRoleOk = writeStorage(OPS_AUTH_COOKIE_ACTOR_ROLE, actorRole);
  const storagePresent = storageTokenOk && storageActorIdOk && storageActorRoleOk;

  const encodedToken = encodeURIComponent(token);
  const encodedActorId = encodeURIComponent(actorId);
  const encodedActorRole = encodeURIComponent(actorRole);

  let cookieTokenPresent = false;
  if (byteLengthUtf8(encodedToken) <= COOKIE_BYTE_BUDGET) {
    writeCookie(OPS_AUTH_COOKIE_TOKEN, encodedToken, maxAgeSeconds);
    expireCookie(OPS_AUTH_MARKER_COOKIE);
    cookieTokenPresent = document.cookie.includes(`${OPS_AUTH_COOKIE_TOKEN}=`);
  } else {
    expireCookie(OPS_AUTH_COOKIE_TOKEN);
    writeCookie(OPS_AUTH_MARKER_COOKIE, "1", maxAgeSeconds);
    cookieTokenPresent = false;
  }

  writeCookie(OPS_AUTH_COOKIE_ACTOR_ID, encodedActorId, maxAgeSeconds);
  writeCookie(OPS_AUTH_COOKIE_ACTOR_ROLE, encodedActorRole, maxAgeSeconds);

  return { cookieTokenPresent, storagePresent };
}

/**
 * cookie 우선, 없으면 localStorage. cookie에 토큰이 없고 storage에 있으면 재수화 시도.
 */
export function getOpsAuthSession(): OpsAuthSession {
  if (!isBrowser()) {
    return { token: "", actorId: "", actorRole: "" };
  }

  const cookieMap = parseCookieMap(document.cookie ?? "");
  let token = (cookieMap.get(OPS_AUTH_COOKIE_TOKEN) || "").trim();
  let actorId = cookieMap.get(OPS_AUTH_COOKIE_ACTOR_ID) || "";
  let actorRole = cookieMap.get(OPS_AUTH_COOKIE_ACTOR_ROLE) || "";

  const storageToken = readStorage(OPS_AUTH_COOKIE_TOKEN).trim();
  const storageActorId = readStorage(OPS_AUTH_COOKIE_ACTOR_ID);
  const storageActorRole = readStorage(OPS_AUTH_COOKIE_ACTOR_ROLE);

  if (!token && storageToken) {
    token = storageToken;
    if (!actorId) {
      actorId = storageActorId;
    }
    if (!actorRole) {
      actorRole = storageActorRole;
    }
    // best-effort rehydrate cookie (or marker when oversized)
    setOpsAuthSession({
      token,
      actorId: actorId || storageActorId,
      actorRole: actorRole || storageActorRole || "HQ_ADMIN"
    });
  } else {
    if (!actorId && storageActorId) {
      actorId = storageActorId;
    }
    if (!actorRole && storageActorRole) {
      actorRole = storageActorRole;
    }
  }

  return {
    token,
    actorId,
    actorRole: actorRole || "HQ_ADMIN"
  };
}

export function clearOpsAuthSession(): void {
  expireCookie(OPS_AUTH_COOKIE_TOKEN);
  expireCookie(OPS_AUTH_COOKIE_ACTOR_ID);
  expireCookie(OPS_AUTH_COOKIE_ACTOR_ROLE);
  expireCookie(OPS_AUTH_MARKER_COOKIE);
  removeStorage(OPS_AUTH_COOKIE_TOKEN);
  removeStorage(OPS_AUTH_COOKIE_ACTOR_ID);
  removeStorage(OPS_AUTH_COOKIE_ACTOR_ROLE);
}

export function hasOpsAuthSession(): boolean {
  const { token } = getOpsAuthSession();
  return token.trim().length > 0;
}
