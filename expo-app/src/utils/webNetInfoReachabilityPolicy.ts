/**
 * Expo web NetInfo reachability URL/판정 순수 규칙 (테스트 가능).
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { AUTH_API } from '@/api/endpoints';

/** 테스트·진단용 — web configure 와 동일 URL 규칙 (Metro `/` 금지) */
export function buildWebReachabilityUrl(apiBaseUrl: string): string {
  const base = (apiBaseUrl || '').replace(/\/$/, '');
  return `${base}${AUTH_API.GET_CURRENT_USER}`;
}

/**
 * HTTP 응답이 오기만 하면 전송 경로가 살아 있다고 본다 (401/404 포함).
 * fetch 실패·타임아웃은 NetInfo 가 unreachable 로 처리한다.
 */
export function isReachabilityHttpSuccess(status: number): boolean {
  return Number.isFinite(status) && status > 0 && status < 600;
}
