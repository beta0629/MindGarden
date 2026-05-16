/**
 * 웹 어드민 SPA origin — 컴포넌트에 호스트 하드코딩 금지
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import Constants from 'expo-constants';
import { getApiBaseUrl } from './apiBaseUrl';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * `EXPO_PUBLIC_WEB_BASE_URL` → `extra.webBaseUrl` → API origin 순.
 */
export function getWebBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  const extra = Constants.expoConfig?.extra as { webBaseUrl?: string } | undefined;
  const fromExtra = extra?.webBaseUrl?.trim();
  if (fromExtra) {
    return stripTrailingSlash(fromExtra);
  }

  const api = getApiBaseUrl();
  try {
    return stripTrailingSlash(new URL(api).origin);
  } catch {
    return stripTrailingSlash(api);
  }
}

/** 웹 어드민 상대 경로(`/admin/...`)를 절대 URL로 */
export function buildAdminWebUrl(relativePath: string): string {
  const base = getWebBaseUrl();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}
