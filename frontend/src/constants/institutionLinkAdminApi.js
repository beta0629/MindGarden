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
  CLIENTS: '/api/v1/admin/clients'
});
