/**
 * GNB·브랜딩용 테넌트 표시명 (UnifiedHeader getTenantDisplayName 과 동일 우선순위)
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

import { toDisplayString } from './safeDisplay';
import { getTenantSubdomainFromHost } from './subdomainUtils';
import { sessionManager } from './sessionManager';

/** 제품명 폴백 (GNB 텍스트·브랜딩 기본값과 동일 출처) */
export const DEFAULT_GNB_LOGO_LABEL = 'Core Solution';

/** 로그인 전 서브도메인 기준 테넌트 표시명 (UnifiedLogin·PrivacyConsentModal 공통) */
export const SESSION_SUBDOMAIN_TENANT_NAME_KEY = 'subdomain_tenant_name';

function pickTenantDisplayPart(value) {
  const s = toDisplayString(value, '').trim();
  return s.length > 0 ? s : '';
}

/**
 * 사용자·브랜딩에서만 표시명 추출 (없으면 빈 문자열)
 * @param {object|null|undefined} user
 * @param {object|null|undefined} brandingInfo
 * @returns {string}
 */
function resolveTenantGnbLabelFromUserAndBranding(user, brandingInfo) {
  const fromUserTenant = pickTenantDisplayPart(user?.tenant?.name);
  if (fromUserTenant) {
    return fromUserTenant;
  }
  const fromTenantName = pickTenantDisplayPart(user?.tenantName);
  if (fromTenantName) {
    return fromTenantName;
  }
  const fromBranch = pickTenantDisplayPart(user?.branchName);
  if (fromBranch) {
    return fromBranch;
  }
  const fromBranding = pickTenantDisplayPart(brandingInfo?.companyName);
  if (fromBranding) {
    return fromBranding;
  }
  return '';
}

/**
 * 우선순위: user.tenant.name → user.tenantName → user.branchName → brandingInfo.companyName → fallback
 *
 * @param {object|null|undefined} user - 세션 사용자
 * @param {object|null|undefined} brandingInfo - 브랜딩 API 결과
 * @param {string} [fallback=DEFAULT_GNB_LOGO_LABEL] - 최종 폴백
 * @returns {string}
 */
export function getTenantGnbLabel(user, brandingInfo, fallback = DEFAULT_GNB_LOGO_LABEL) {
  const resolved = resolveTenantGnbLabelFromUserAndBranding(user, brandingInfo);
  if (resolved) {
    return resolved;
  }
  return toDisplayString(fallback, DEFAULT_GNB_LOGO_LABEL);
}

/**
 * sessionStorage에 저장된 서브도메인 조회 테넌트 표시명
 * @returns {string}
 */
export function getStoredSubdomainTenantDisplayName() {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.window?.sessionStorage) {
      return '';
    }
    return pickTenantDisplayPart(
      globalThis.window.sessionStorage.getItem(SESSION_SUBDOMAIN_TENANT_NAME_KEY)
    );
  } catch {
    return '';
  }
}

/**
 * 동의 모달 인트로용 테넌트 라벨 (로그인 사용자 → 저장된 서브도메인 테넌트명 → 호스트 서브도메인 → 제품명)
 *
 * @param {object} [options]
 * @param {object|null|undefined} [options.user] - 미전달 시 sessionManager.getUser()
 * @param {object|null|undefined} [options.brandingInfo]
 * @param {string|null|undefined} [options.tenantDisplayName] - 호출부 명시 라벨(비어 있지 않을 때만 우선)
 * @returns {string}
 */
export function getConsentModalTenantLabel(options = {}) {
  const {
    user: explicitUser,
    brandingInfo = null,
    tenantDisplayName: propLabel = null
  } = options;
  const user = Object.prototype.hasOwnProperty.call(options, 'user')
    ? explicitUser
    : sessionManager.getUser();

  const fromProp = pickTenantDisplayPart(propLabel);
  if (fromProp) {
    return fromProp;
  }

  const fromUser = resolveTenantGnbLabelFromUserAndBranding(user, brandingInfo);
  if (fromUser) {
    return fromUser;
  }

  const fromSession = getStoredSubdomainTenantDisplayName();
  if (fromSession) {
    return fromSession;
  }

  const fromHostSub = pickTenantDisplayPart(getTenantSubdomainFromHost());
  if (fromHostSub) {
    return fromHostSub;
  }

  return DEFAULT_GNB_LOGO_LABEL;
}

/**
 * 세션에 테넌트 표시명이 없고 사용자·브랜딩에서도 라벨이 없을 때, 호스트 서브도메인으로 API 보강을 시도할지
 *
 * @param {object} [options]
 * @param {object|null|undefined} [options.user] - 미전달 시 sessionManager.getUser()
 * @param {object|null|undefined} [options.brandingInfo]
 * @returns {boolean}
 */
export function shouldFetchSubdomainTenantDisplayNameForConsent(options = {}) {
  const {
    user: explicitUser,
    brandingInfo = null,
    tenantDisplayName: propLabel = null
  } = options;
  const user = Object.prototype.hasOwnProperty.call(options, 'user')
    ? explicitUser
    : sessionManager.getUser();
  if (pickTenantDisplayPart(propLabel)) {
    return false;
  }
  if (resolveTenantGnbLabelFromUserAndBranding(user, brandingInfo)) {
    return false;
  }
  if (getStoredSubdomainTenantDisplayName()) {
    return false;
  }
  return Boolean(pickTenantDisplayPart(getTenantSubdomainFromHost()));
}
