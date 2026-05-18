/**
 * API·Query `enabled`용 effective tenantId — JWT 동기 우선 (Android release ready 고착 방지)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';
import { resolveEffectiveUserTenantId } from '@/utils/resolveEffectiveUserTenantId';
import {
  resolveTenantIdFromSources,
  type ResolveTenantIdSources,
} from '@/utils/resolveTenantIdFromSources';

export type ResolveEffectiveTenantIdForApiInput = {
  /** auth·tenant MMKV rehydrate 완료 및 auth 로딩 종료 */
  storesResolved: boolean;
  accessToken: string | null | undefined;
  headerTenantId?: string | null;
  userTenantId?: string | null;
  tenantCode?: string | null;
  recentTenants: ResolveTenantIdSources['recentTenants'];
};

function resolveFromRecentTenants(
  tenantCode: string | null | undefined,
  recentTenants: ResolveEffectiveTenantIdForApiInput['recentTenants'],
): string {
  return resolveTenantIdFromSources({
    userTenantId: '',
    headerTenantId: '',
    tenantCode,
    recentTenants,
  });
}

/**
 * accessToken JWT tenantId → (storesResolved 시) MMKV·프로필·recentTenants 순.
 * JWT가 있으면 store tenantId가 비어 있어도 즉시 반환한다.
 */
export function resolveEffectiveTenantIdForApi(
  input: ResolveEffectiveTenantIdForApiInput,
): string {
  const fromJwt = extractTenantIdFromAccessToken(input.accessToken);
  if (fromJwt.length > 0) {
    return fromJwt;
  }

  const fromRecent = resolveFromRecentTenants(input.tenantCode, input.recentTenants);
  if (fromRecent.length > 0) {
    return fromRecent;
  }

  if (!input.storesResolved) {
    return '';
  }

  const userEffective = resolveEffectiveUserTenantId(
    input.userTenantId,
    input.accessToken,
  );
  return resolveTenantIdFromSources({
    headerTenantId: input.headerTenantId,
    userTenantId: userEffective,
    tenantCode: input.tenantCode,
    recentTenants: input.recentTenants,
  });
}
