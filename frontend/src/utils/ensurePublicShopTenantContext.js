/**
 * 공개 쇼핑 카탈로그용 테넌트 컨텍스트 확보 (서브도메인 → sessionStorage).
 *
 * @author MindGarden
 * @since 2026-09-16
 */

import { fetchTenantPublicHomeMeta } from './tenantPublicHomeMeta';

/**
 * 익명 카탈로그 호출 전 subdomain_tenant_id 를 채운다.
 * 이미 있으면 no-op. Host 서브도메인으로 by-subdomain 조회.
 *
 * @returns {Promise<string|null>} tenantId 또는 null
 */
export async function ensurePublicShopTenantContext() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  const existing = window.sessionStorage.getItem('subdomain_tenant_id');
  if (existing && typeof existing === 'string' && existing.trim()) {
    return existing.trim();
  }

  try {
    const meta = await fetchTenantPublicHomeMeta();
    const tenantId = meta?.tenant?.tenantId;
    if (!meta?.found || !tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
      return null;
    }
    const trimmed = tenantId.trim();
    window.sessionStorage.setItem('subdomain_tenant_id', trimmed);
    if (meta.tenant.name) {
      window.sessionStorage.setItem('subdomain_tenant_name', String(meta.tenant.name));
    }
    if (meta.subdomain) {
      window.sessionStorage.setItem('subdomain', String(meta.subdomain));
    }
    return trimmed;
  } catch (e) {
    console.warn('공개 쇼핑 테넌트 컨텍스트 확보 실패:', e);
    return null;
  }
}
