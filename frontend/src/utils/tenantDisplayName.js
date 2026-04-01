/**
 * GNB·브랜딩용 테넌트 표시명 (UnifiedHeader getTenantDisplayName 과 동일 우선순위)
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

import { toDisplayString } from './safeDisplay';

/** 제품명 폴백 (GNB 텍스트·브랜딩 기본값과 동일 출처) */
export const DEFAULT_GNB_LOGO_LABEL = 'Core Solution';

/**
 * 우선순위: user.tenant.name → user.tenantName → user.branchName → brandingInfo.companyName → fallback
 *
 * @param {object|null|undefined} user - 세션 사용자
 * @param {object|null|undefined} brandingInfo - 브랜딩 API 결과
 * @param {string} [fallback=DEFAULT_GNB_LOGO_LABEL] - 최종 폴백
 * @returns {string}
 */
export function getTenantGnbLabel(user, brandingInfo, fallback = DEFAULT_GNB_LOGO_LABEL) {
  const pick = (value) => {
    const s = toDisplayString(value, '').trim();
    return s.length > 0 ? s : '';
  };

  const fromUserTenant = pick(user?.tenant?.name);
  if (fromUserTenant) {
    return fromUserTenant;
  }
  const fromTenantName = pick(user?.tenantName);
  if (fromTenantName) {
    return fromTenantName;
  }
  const fromBranch = pick(user?.branchName);
  if (fromBranch) {
    return fromBranch;
  }
  const fromBranding = pick(brandingInfo?.companyName);
  if (fromBranding) {
    return fromBranding;
  }
  return toDisplayString(fallback, DEFAULT_GNB_LOGO_LABEL);
}
