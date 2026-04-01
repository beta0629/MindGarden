/**
 * 테넌트 관련 API 경로·권한 상수
 * 백엔드: TenantDisplayNameController, MultiTenantController
 *
 * @author CoreSolution
 * @since 2026-04-01
 */

/** 테넌트 표시명 최대 길이 (tenants.name, 엔티티와 동일) */
export const TENANT_DISPLAY_NAME_MAX_LENGTH = 255;

/** 표시명 변경 API 호출 가능 역할 (Spring hasRole 정합: ADMIN, OPS) */
export const TENANT_DISPLAY_NAME_EDIT_ROLES = Object.freeze(['ADMIN', 'OPS']);

/**
 * 테넌트 표시명 변경 UI/API 권한 여부
 *
 * @param {object|null|undefined} user 세션 사용자
 * @returns {boolean}
 */
export const canEditTenantDisplayName = (user) =>
  !!user?.role && TENANT_DISPLAY_NAME_EDIT_ROLES.includes(user.role);

export const TENANT_API_PATHS = Object.freeze({
  /** GET 현재 테넌트 (MultiTenantController) */
  CURRENT_TENANT: '/api/v1/auth/tenant/current',
  /**
   * PUT 테넌트명
   * @param {string} tenantId
   * @returns {string}
   */
  tenantDisplayName: (tenantId) =>
    `/api/v1/tenants/${encodeURIComponent(tenantId)}/name`
});
