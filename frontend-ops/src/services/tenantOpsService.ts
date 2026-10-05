/**
 * Ops 테넌트 API 클라이언트
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { OPS_API_PATHS } from '@/constants/api';
import { OPS_TENANT_QUERY } from '@/constants/opsTenants';
import { clientApiFetch } from '@/services/clientApi';

export type OpsTenantItem = {
  tenantId: string;
  name: string;
  businessType?: string;
  status: string;
  subdomain?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPerson?: string | null;
};

export async function fetchOpsTenants(includeClosed = false): Promise<OpsTenantItem[]> {
  const path = includeClosed
    ? `${OPS_API_PATHS.TENANTS.ALL}?${OPS_TENANT_QUERY.INCLUDE_CLOSED}`
    : OPS_API_PATHS.TENANTS.ALL;
  const data = await clientApiFetch<OpsTenantItem[]>(path);
  return Array.isArray(data) ? data : [];
}

export async function suspendOpsTenant(tenantId: string): Promise<OpsTenantItem> {
  return clientApiFetch<OpsTenantItem>(OPS_API_PATHS.TENANTS.SUSPEND(tenantId), {
    method: 'POST'
  });
}

export async function resumeOpsTenant(tenantId: string): Promise<OpsTenantItem> {
  return clientApiFetch<OpsTenantItem>(OPS_API_PATHS.TENANTS.RESUME(tenantId), {
    method: 'POST'
  });
}

export async function closeOpsTenant(tenantId: string): Promise<OpsTenantItem> {
  return clientApiFetch<OpsTenantItem>(OPS_API_PATHS.TENANTS.CLOSE(tenantId), {
    method: 'POST'
  });
}

/**
 * 종료 성공 후 해당 테넌트 블록만 바꾼다. 목록 전체를 다시 받지 않는다.
 */
export function replaceTenantItem(
  tenants: OpsTenantItem[],
  updated: OpsTenantItem
): OpsTenantItem[] {
  return tenants.map((item) =>
    item.tenantId === updated.tenantId ? { ...item, ...updated } : item
  );
}
