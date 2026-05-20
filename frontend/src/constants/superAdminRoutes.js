/**
 * 슈퍼어드민 라우트·역할 상수
 *
 * @author CoreSolution
 * @since 2026-05-22
 */

import { LEGACY_USER_ROLES } from './roles';

/** 서버 {@code @PreAuthorize("hasRole('SUPER_ADMIN')")} 와 동일 */
export const SUPER_ADMIN_ROLE = LEGACY_USER_ROLES.SUPER_ADMIN;

export const SUPER_ADMIN_ROUTES = {
  TENANT_COMPONENTS: '/super_admin/tenant-components'
};
