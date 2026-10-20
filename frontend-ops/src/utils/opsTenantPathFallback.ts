import type { NotifiedClientError } from "@/utils/clientApiError";

/**
 * Ops 테넌트 경로 → ops alias 폴백 공통 유틸.
 * HTTP 404 에서만 폴백하고, 그 외 상태(400/401/403/5xx 등)는 그대로 재throw 한다.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

/** HTTP Not Found — 테넌트 경로 미존재 시에만 ops alias 폴백 */
export const OPS_TENANT_PATH_FALLBACK_STATUS = 404 as const;

/**
 * 오류가 HTTP 404 인지 판별한다 ({@link NotifiedClientError}.status).
 *
 * @param error catch 한 오류
 * @returns 404 이면 true
 */
export function isHttpNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }
  const status = (error as NotifiedClientError).status;
  return status === OPS_TENANT_PATH_FALLBACK_STATUS;
}

/**
 * 1차(테넌트) 경로를 시도하고, HTTP 404 일 때만 fallback(ops alias)을 호출한다.
 * 그 외 오류는 서버 status·message 를 보존한 채 재throw 한다.
 *
 * @param primary 테넌트 경로 호출
 * @param fallback ops alias 호출
 * @returns primary 또는 fallback 성공 결과
 * @throws primary 가 404가 아닌 실패, 또는 fallback 실패
 */
export async function withOpsTenantPathFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!isHttpNotFoundError(error)) {
      throw error;
    }
    return fallback();
  }
}
