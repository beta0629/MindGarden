/**
 * Admin 목록 API 공통 fetch — page/size SSOT 강제.
 *
 * bare `...?view=summary` 또는 page/size 없는 LIST 호출을 금지한다.
 * 기본값: {@link ADMIN_DASHBOARD_LIST_PAGE} / {@link ADMIN_DASHBOARD_LIST_PAGE_SIZE}.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import StandardizedApi from '../utils/standardizedApi';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import {
  ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
  ADMIN_DASHBOARD_LIST_PAGE,
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  ADMIN_MAPPINGS_PAGED_LIST_QUERY,
  ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY,
  API_ADMIN_SCHEDULES
} from '../constants/adminDashboardWidgetConstants';

/**
 * path 에서 query 를 분리한다.
 * @param {string} path
 * @returns {{ cleanPath: string, queryFromPath: Record<string, string> }}
 */
function splitPathAndQuery(path) {
  const raw = typeof path === 'string' ? path : '';
  const qIndex = raw.indexOf('?');
  if (qIndex < 0) {
    return { cleanPath: raw, queryFromPath: {} };
  }
  const cleanPath = raw.slice(0, qIndex);
  const queryFromPath = {};
  const params = new URLSearchParams(raw.slice(qIndex + 1));
  params.forEach((value, key) => {
    queryFromPath[key] = value;
  });
  return { cleanPath, queryFromPath };
}

/**
 * Admin 목록 쿼리 파라미터 — page/size 는 항상 포함.
 *
 * @param {Object} [options={}]
 * @param {number|string} [options.page]
 * @param {number|string} [options.size]
 * @param {string} [options.view]
 * @returns {Record<string, string|number>}
 */
export function buildAdminListParams(options = {}) {
  const merged = { ...(options || {}) };
  if (merged.page == null || merged.page === '') {
    merged.page = ADMIN_DASHBOARD_LIST_PAGE;
  }
  if (merged.size == null || merged.size === '') {
    merged.size = ADMIN_DASHBOARD_LIST_PAGE_SIZE;
  }
  return merged;
}

/**
 * Admin 목록 URL — path 의 기존 query 를 제거하고 병합 params 로 재조립.
 * page/size 는 절대 생략하지 않는다.
 *
 * @param {string} path
 * @param {Object} [options={}]
 * @returns {string}
 */
export function buildAdminListUrl(path, options = {}) {
  const { cleanPath, queryFromPath } = splitPathAndQuery(path);
  const params = buildAdminListParams({ ...queryFromPath, ...(options || {}) });
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${cleanPath}?${qs}` : cleanPath;
}

/**
 * Admin 목록 GET — StandardizedApi + page/size 강제.
 * path 에 `?` 가 있으면 파싱·병합 후 clean path 로 호출한다.
 *
 * @param {string} path
 * @param {Object} [options={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminListGet(path, options = {}, apiOptions = {}) {
  const { cleanPath, queryFromPath } = splitPathAndQuery(path);
  const params = buildAdminListParams({ ...queryFromPath, ...(options || {}) });
  return StandardizedApi.get(cleanPath, params, apiOptions);
}

/**
 * with-mapping-info (summary + page/size SSOT).
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminClientsWithMappingGet(extra = {}, apiOptions = {}) {
  return adminListGet(
    API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
    { ...ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY, ...(extra || {}) },
    apiOptions
  );
}

/**
 * mappings LIST (page/size SSOT).
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminMappingsListGet(extra = {}, apiOptions = {}) {
  return adminListGet(
    API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
    { ...ADMIN_MAPPINGS_PAGED_LIST_QUERY, ...(extra || {}) },
    apiOptions
  );
}

/**
 * Admin schedules LIST (page/size SSOT).
 * 가예약 기본 쿼리: {@link ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY}
 * (`status=TENTATIVE_PENDING_PAYMENT` 만).
 * bare StandardizedApi.get + status=BOOKED / PENDING / TENTATIVE 단독 금지.
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminSchedulesListGet(extra = {}, apiOptions = {}) {
  return adminListGet(
    API_ADMIN_SCHEDULES,
    { ...ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY, ...(extra || {}) },
    apiOptions
  );
}
