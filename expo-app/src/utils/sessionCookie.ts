/**
 * 서버 JSESSIONID — iOS는 네이티브가 Set-Cookie를 유지하지만 Android(OkHttp)는 자동 전달이 없다.
 * 로그인 응답의 sessionId를 저장해 Cookie 헤더로 보내 SessionBasedAuthenticationFilter와 맞춘다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY_JSESSION_ID = 'mg_jsession_id';

export async function getJsessionId(): Promise<string | null> {
  const v = await SecureStore.getItemAsync(SECURE_KEY_JSESSION_ID);
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

export async function setJsessionId(sessionId: string | null | undefined): Promise<void> {
  const t = sessionId?.trim();
  if (t && t.length > 0) {
    await SecureStore.setItemAsync(SECURE_KEY_JSESSION_ID, t);
    return;
  }
  await SecureStore.deleteItemAsync(SECURE_KEY_JSESSION_ID);
}

export async function clearJsessionId(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEY_JSESSION_ID);
}

/** axios 인터셉터용 — 동기 getState 대신 SecureStore는 비동기라 미리 로드한 값을 넘긴다 */
export function formatJsessionCookieHeader(sessionId: string | null | undefined): string | null {
  const t = sessionId?.trim();
  if (!t) {
    return null;
  }
  return `JSESSIONID=${t}`;
}

let cachedJsessionId: string | null = null;

export function peekCachedJsessionId(): string | null {
  return cachedJsessionId;
}

export function setCachedJsessionId(sessionId: string | null): void {
  cachedJsessionId = sessionId?.trim() || null;
}

export async function hydrateJsessionCacheFromSecureStore(): Promise<string | null> {
  const id = await getJsessionId();
  setCachedJsessionId(id);
  return id;
}
