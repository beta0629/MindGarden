/**
 * Admin 페이지드 목록 API SSOT — page+size 강제.
 *
 * DASHBOARD MUST NOT CALL fetchAdminMappingsList / MAPPINGS.LIST.
 * 대시보드 마운트는 MAPPINGS.STATS 만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import StandardizedApi from './standardizedApi';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { DEFAULTS } from '../constants/adminDashboard';
import {
  ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
  ADMIN_MAPPINGS_PAGED_LIST_QUERY
} from '../constants/adminDashboardWidgetConstants';

/** consultation-messages/all — 어드민 인박스 목록 */
const API_CONSULTATION_MESSAGES_ALL = '/api/v1/consultation-messages/all';

/**
 * with-mapping-info URL 빌더 — view+page+size 항상 포함.
 * extraQuery 로 page/size 를 덮어쓸 수 있으나 키 자체는 절대 제거하지 않는다.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extraQuery]
 * @returns {string}
 */
export function buildAdminClientsWithMappingInfoUrl(extraQuery = {}) {
  const merged = {
    ...ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
    ...extraQuery,
    view: extraQuery.view ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.view,
    page: extraQuery.page ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page,
    size: extraQuery.size ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size
  };
  const query = new URLSearchParams();
  Object.keys(merged).forEach((key) => {
    const value = merged[key];
    if (value === undefined || value === null) {
      return;
    }
    query.set(key, String(value));
  });
  // page/size 재강제 — extra 가 실수로 지워도 복원
  query.set('page', String(merged.page ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page));
  query.set('size', String(merged.size ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size));
  if (!query.has('view')) {
    query.set('view', String(ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.view));
  }
  return `${API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO}?${query.toString()}`;
}

/**
 * with-mapping-info GET — page+size(+view) 강제 쿼리.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extraQuery]
 * @returns {Promise<any>}
 */
export function fetchAdminClientsWithMappingInfo(extraQuery = {}) {
  const query = {
    ...ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
    ...extraQuery,
    page: extraQuery.page ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page,
    size: extraQuery.size ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size,
    view: extraQuery.view ?? ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.view
  };
  return StandardizedApi.get(API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO, query);
}

/**
 * mappings LIST GET — ALWAYS page+size.
 * DASHBOARD MUST NOT CALL THIS. 목록 화면(통합스케줄·매칭관리 등) 전용.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extraQuery]
 * @returns {Promise<any>}
 */
export function fetchAdminMappingsList(extraQuery = {}) {
  const query = {
    ...ADMIN_MAPPINGS_PAGED_LIST_QUERY,
    ...extraQuery,
    page: extraQuery.page ?? ADMIN_MAPPINGS_PAGED_LIST_QUERY.page,
    size: extraQuery.size ?? ADMIN_MAPPINGS_PAGED_LIST_QUERY.size
  };
  return StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, query);
}

/**
 * consultation-messages/all GET — ALWAYS page+size.
 * 어드민 인박스 전용. size 미지정 시 DEFAULTS.PAGE_SIZE.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} [extraQuery]
 * @returns {Promise<any>}
 */
export function fetchAdminConsultationMessagesAll(extraQuery = {}) {
  const query = {
    ...extraQuery,
    page: extraQuery.page ?? 0,
    size: extraQuery.size ?? DEFAULTS.PAGE_SIZE
  };
  return StandardizedApi.get(API_CONSULTATION_MESSAGES_ALL, query);
}
