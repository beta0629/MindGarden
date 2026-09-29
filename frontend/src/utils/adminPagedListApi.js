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
  adminClientsWithMappingGetAll,
  adminClientsWithStatsGet,
  adminConsultantsWithStatsGet,
  adminMappingsListGet,
  adminMappingsListGetAll,
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
 * with-mapping-info 전체 페이지 drain — ALWAYS page+size per page.
 * 배정/피커·선택 UI 전용. 대시보드 KPI 는 {@link fetchAdminClientsWithMappingInfo} 유지.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function fetchAdminClientsWithMappingInfoAll(extra = {}) {
  return adminClientsWithMappingGetAll(extra);
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
 * mappings LIST 전체 페이지 drain — ALWAYS page+size per page.
 * DASHBOARD MUST NOT CALL THIS. 통합스케줄 등 전체 목록 필요 화면 전용.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extra={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function fetchAdminMappingsListAll(extra = {}) {
  return adminMappingsListGetAll(extra);
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
