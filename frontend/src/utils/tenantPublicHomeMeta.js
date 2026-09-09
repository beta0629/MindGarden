/**
 * 테넌트 공개 홈 메타 (서브도메인 → by-subdomain)
 */

import { API_BASE_URL } from '../constants/api';
import { getTenantSubdomainFromHost } from './subdomainUtils';
import { extractMerchantLegalFromTenantPayload } from './merchantLegalApi';

/**
 * @returns {Promise<{found:boolean,tenant:object|null,host:string,subdomain:string}>}
 */
export async function fetchTenantPublicHomeMeta() {
  const subdomain = getTenantSubdomainFromHost();
  const host =
    typeof globalThis !== 'undefined' && globalThis.window?.location
      ? globalThis.window.location.host
      : '';

  if (!subdomain) {
    return { found: false, tenant: null, host, subdomain: '' };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/tenant/by-subdomain?subdomain=${encodeURIComponent(subdomain)}`,
    {
      credentials: 'include',
      method: 'GET',
      headers: { Accept: 'application/json' }
    }
  );

  if (!response.ok) {
    return { found: false, tenant: null, host, subdomain };
  }

  const result = await response.json();
  const data = result?.success && result?.data ? result.data : result;
  if (!data?.found || !data?.tenant) {
    return { found: false, tenant: null, host, subdomain };
  }

  const tenant = data.tenant;
  return {
    found: true,
    host,
    subdomain,
    tenant: {
      tenantId: tenant.tenantId,
      name: tenant.name || '',
      subdomain: tenant.subdomain || subdomain,
      primaryColor: tenant.primaryColor || '',
      merchantLegal: extractMerchantLegalFromTenantPayload(tenant)
    }
  };
}
