/**
 * Ops 테넌트 API 클라이언트
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { OPS_API_PATHS } from '@/constants/api';
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

export async function fetchOpsTenants(): Promise<OpsTenantItem[]> {
  const data = await clientApiFetch<OpsTenantItem[]>(OPS_API_PATHS.TENANTS.ALL);
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
