/**
 * 슈퍼어드민 — 테넌트 컴포넌트 OPS API
 *
 * @author CoreSolution
 * @since 2026-05-22
 */

export const SUPER_ADMIN_TENANT_COMPONENT_API = {
  SHOP_REWARD_ACTIVATE: (tenantId) =>
    `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}/components/shop-reward/activate`
};
