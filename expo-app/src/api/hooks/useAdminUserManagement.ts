/**
 * 어드민·스태프 — 사용자 관리 목록 (읽기 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  normalizeAdminManagedUserList,
  type AdminManagedUserListItem,
} from '@/utils/adminUserManagementNormalize';
import type { AdminUserManagementRoleFilter } from '@/constants/adminUserManagementCopy';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';

const QUERY_BASE = ['admin-mobile', 'user-management'] as const;

export const ADMIN_USER_MANAGEMENT_QUERY_KEYS = {
  all: QUERY_BASE,
  list: (tenantId: string, roleFilter: AdminUserManagementRoleFilter, includeInactive: boolean) =>
    [...QUERY_BASE, 'list', tenantId, roleFilter, includeInactive] as const,
};

function buildListQueryParams(
  roleFilter: AdminUserManagementRoleFilter,
  includeInactive: boolean,
): Record<string, unknown> {
  if (roleFilter !== 'ALL') {
    return { includeInactive, role: roleFilter };
  }
  return { includeInactive };
}

async function fetchAdminUserManagementList(
  roleFilter: AdminUserManagementRoleFilter,
  includeInactive: boolean,
): Promise<AdminManagedUserListItem[]> {
  const raw = await apiGet<unknown>(
    ADMIN_MOBILE_API.USER_MANAGEMENT,
    buildListQueryParams(roleFilter, includeInactive),
  );
  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (root.success === false) {
      throw new Error(toDisplayString(root.message, '사용자 목록을 불러오지 못했습니다.'));
    }
  }
  return normalizeAdminManagedUserList(raw);
}

export function useAdminUserManagement(
  roleFilter: AdminUserManagementRoleFilter,
  options?: {
    readonly includeInactive?: boolean;
  } & Partial<UseQueryOptions<AdminManagedUserListItem[]>>,
) {
  const { includeInactive = false, enabled: enabledOverride, ...queryOptions } = options ?? {};
  const { ready, tenantId } = useApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);

  return useQuery<AdminManagedUserListItem[]>({
    queryKey: ADMIN_USER_MANAGEMENT_QUERY_KEYS.list(tenantId, roleFilter, includeInactive),
    queryFn: () => fetchAdminUserManagementList(roleFilter, includeInactive),
    enabled: ready && allowed && enabledOverride !== false,
    staleTime: 1000 * 60,
    refetchOnMount: 'always',
    ...queryOptions,
  });
}
