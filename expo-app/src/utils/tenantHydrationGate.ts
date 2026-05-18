/**
 * MMKV tenant rehydrate 게이트 — JWT/recent로 tenantId가 이미 있으면 hydrate 대기 생략
 *
 * @author MindGarden
 * @since 2026-05-18
 */
export function isTenantHydrationGateOk(
  tenantHasHydrated: boolean,
  effectiveTenantId: string,
): boolean {
  return tenantHasHydrated || Boolean(effectiveTenantId.trim());
}
