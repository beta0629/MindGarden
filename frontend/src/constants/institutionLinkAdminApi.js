/**
 * 타기관 연계 어드민 API 경로.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

export const INSTITUTION_LINK_API = Object.freeze({
  INSTITUTIONS: '/api/v1/admin/partner-institutions',
  INSTITUTION: (id) => `/api/v1/admin/partner-institutions/${id}`,
  CONTRACTS: '/api/v1/admin/institution-link-contracts',
  MONTHLY_BILLING_RUN: '/api/v1/admin/institution-link-contracts/billing-runs/monthly',
  CLIENTS: '/api/v1/admin/clients'
});

/**
 * StandardizedApi GET 목록 언랩.
 *
 * @param {unknown} raw
 * @returns {object[]}
 */
export function unwrapPartnerInstitutionList(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && Array.isArray(raw.data)) {
    return raw.data;
  }
  return [];
}

/**
 * StandardizedApi POST 단건 언랩.
 *
 * @param {unknown} raw
 * @returns {object|null}
 */
export function unwrapPartnerInstitution(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  if (raw.id != null) {
    return raw;
  }
  if (raw.data && raw.data.id != null) {
    return raw.data;
  }
  return null;
}
