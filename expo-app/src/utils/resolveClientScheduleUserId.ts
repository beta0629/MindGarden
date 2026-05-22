/**
 * 내담자 일정 API userId — auth store + JWT sub 병합
 *
 * iOS SecureStore rehydrate 직후 store user.id 가 비어 있어도 JWT sub 로 보완한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { decodeJwtPayload, parseJwtSubAsUserId } from '@/utils/jwtPayload';

export function resolveClientScheduleUserId(
  storeUserId: number | undefined,
  accessToken: string | null,
): number | undefined {
  if (typeof storeUserId === 'number' && Number.isFinite(storeUserId) && storeUserId > 0) {
    return storeUserId;
  }
  if (!accessToken?.trim()) {
    return undefined;
  }
  const fromJwt = parseJwtSubAsUserId(decodeJwtPayload(accessToken));
  return fromJwt != null && fromJwt > 0 ? fromJwt : undefined;
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
