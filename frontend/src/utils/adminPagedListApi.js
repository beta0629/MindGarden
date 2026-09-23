/**
 * Compatibility shim — re-exports #1201 names from adminListFetch SSOT.
 *
 * Canonical module: {@link ../api/adminListFetch.js}
 *
 * DASHBOARD MUST NOT CALL fetchAdminMappingsList / MAPPINGS.LIST.
 * 대시보드 마운트는 MAPPINGS.STATS 만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY } from '../constants/adminDashboardWidgetConstants';
import {
  adminClientsWithMappingGet,
  adminClientsWithStatsGet,
  adminConsultantsWithStatsGet,
  adminMappingsListGet,
  buildAdminListUrl
} from '../api/adminListFetch';

/**
 * with-mapping-info URL 빌더 — view+page+size 항상 포함.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {string}
 */
export function buildAdminClientsWithMappingInfoUrl(extra = {}) {
  return buildAdminListUrl(API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO, {
    ...ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
    ...(extra || {})
  });
}

/**
 * with-mapping-info GET — page+size(+view) 강제 쿼리.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 */
export function fetchAdminClientsWithMappingInfo(extra = {}) {
  return adminClientsWithMappingGet(extra);
}

/**
 * mappings LIST GET — ALWAYS page+size.
 * DASHBOARD MUST NOT CALL THIS. 목록 화면(통합스케줄·매칭관리 등) 전용.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 */
export function fetchAdminMappingsList(extra = {}) {
  return adminMappingsListGet(extra);
}

/**
 * clients with-stats LIST GET — ALWAYS page+size.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 */
export function fetchAdminClientsWithStats(extra = {}) {
  return adminClientsWithStatsGet(extra);
}

/**
 * consultants with-stats LIST GET — ALWAYS page+size.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 */
export function fetchAdminConsultantsWithStats(extra = {}) {
  return adminConsultantsWithStatsGet(extra);
}
