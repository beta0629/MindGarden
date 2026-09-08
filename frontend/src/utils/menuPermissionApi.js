/**
 * 메뉴 권한 API 유틸리티 (StandardizedApi)
 *
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-12-03
 * @updated 2026-09-08 — StandardizedApi + tenant roles
 */

import StandardizedApi from './standardizedApi';

const MENU_PERM_BASE = '/api/v1/admin/menu-permissions';
const TENANT_ROLES = '/api/v1/tenant/roles';

const asEnvelope = (response) => {
  if (response && typeof response === 'object' && 'success' in response) {
    return response;
  }
  return { success: true, data: response };
};

/**
 * 현재 테넌트 역할 목록 (메뉴 권한 칩용)
 * @returns {Promise<Array<{tenantRoleId:string,nameKo?:string,nameEn?:string,templateCode?:string}>>}
 */
export const fetchTenantRolesForMenuPermission = async () => {
  const response = await StandardizedApi.get(TENANT_ROLES, {}, { unwrapApiEnvelope: false });
  const envelope = asEnvelope(response);
  const list = envelope.data || envelope || [];
  return Array.isArray(list) ? list : [];
};

/**
 * 역할별 메뉴 권한 목록 조회
 */
export const getRoleMenuPermissions = async (roleId) => {
  const response = await StandardizedApi.get(
    `${MENU_PERM_BASE}/roles/${roleId}`,
    {},
    { unwrapApiEnvelope: false }
  );
  return asEnvelope(response);
};

/**
 * 메뉴 권한 부여
 */
export const grantMenuPermission = async (request) => {
  const response = await StandardizedApi.post(
    `${MENU_PERM_BASE}/grant`,
    request,
    { unwrapApiEnvelope: false }
  );
  return asEnvelope(response);
};

/**
 * 메뉴 권한 회수
 */
export const revokeMenuPermission = async (roleId, menuId) => {
  const qs = `roleId=${encodeURIComponent(roleId)}&menuId=${encodeURIComponent(menuId)}`;
  const response = await StandardizedApi.delete(
    `${MENU_PERM_BASE}/revoke?${qs}`,
    { unwrapApiEnvelope: false }
  );
  return asEnvelope(response);
};

/**
 * 메뉴 권한 일괄 설정
 */
export const batchUpdateMenuPermissions = async (roleId, requests) => {
  const response = await StandardizedApi.post(
    `${MENU_PERM_BASE}/batch?roleId=${encodeURIComponent(roleId)}`,
    requests,
    { unwrapApiEnvelope: false }
  );
  return asEnvelope(response);
};

/**
 * 사용자 접근 가능한 메뉴 조회
 */
export const getUserAccessibleMenus = async () => {
  const response = await StandardizedApi.get(
    `${MENU_PERM_BASE}/user/accessible`,
    {},
    { unwrapApiEnvelope: false }
  );
  return asEnvelope(response);
};
