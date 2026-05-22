/**
 * 내담자 일정 API userId — auth store + JWT sub 병합
 *
 * accessToken 이 있으면 JWT sub 를 우선한다. Android MMKV persist `user.id` 가
 * JWT `sub` 와 어긋난 stale 값을 유지하는 경우가 있어, store id 우선 시 잘못된
 * userId 로 schedules/paged 가 호출되어 빈 목록이 될 수 있다.
 * token 이 없을 때만 store id 를 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { decodeJwtPayload, parseJwtSubAsUserId } from '@/utils/jwtPayload';

export function resolveClientScheduleUserId(
  storeUserId: number | undefined,
  accessToken: string | null,
): number | undefined {
  if (accessToken?.trim()) {
    const fromJwt = parseJwtSubAsUserId(decodeJwtPayload(accessToken));
    if (fromJwt != null && fromJwt > 0) {
      return fromJwt;
    }
  }
  if (typeof storeUserId === 'number' && Number.isFinite(storeUserId) && storeUserId > 0) {
    return storeUserId;
  }
  return undefined;
}

export function isClientScheduleQueryEnabled(
  ready: boolean,
  userId: number | undefined,
): boolean {
  return ready && userId != null && userId > 0;
}

export function resolveEffectiveClientScheduleUserId(
  clientId: number | string | undefined,
  userId: number | undefined,
): number | undefined {
  if (clientId != null) {
    const parsed = typeof clientId === 'number' ? clientId : Number(clientId);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return userId;
}
