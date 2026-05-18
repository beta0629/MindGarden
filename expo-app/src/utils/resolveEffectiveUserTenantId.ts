/**
 * API용 userTenantId effective 값 — Bearer JWT 우선 (Android stale MMKV 방지)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';

/**
 * accessToken이 있으면 JWT tenantId가 MMKV user.tenantId보다 우선한다.
 */
export function resolveEffectiveUserTenantId(
  userTenantId: string | null | undefined,
  accessToken: string | null | undefined,
): string {
  const fromJwt = extractTenantIdFromAccessToken(accessToken);
  if (accessToken?.trim()) {
    if (fromJwt.length > 0) {
      return fromJwt;
    }
  }
  const fromUser = (userTenantId ?? '').trim();
  if (fromUser.length > 0) {
    return fromUser;
  }
  return fromJwt;
}
