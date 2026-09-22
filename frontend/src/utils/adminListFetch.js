/**
 * Admin 목록 GET SSOT — page+size 강제.
 *
 * with-mapping-info / mappings LIST / consultation-messages/all 등
 * 어드민 목록 엔드포인트는 항상 페이지 파라미터를 포함한다.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import { DEFAULTS } from '../constants/adminDashboard';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import StandardizedApi from './standardizedApi';

/** 0-based page (PaginationUtils 정합) */
export const ADMIN_LIST_DEFAULT_PAGE = 0;

/** 기본 size — {@link DEFAULTS.PAGE_SIZE} / PaginationUtils.DEFAULT_PAGE_SIZE */
export const ADMIN_LIST_DEFAULT_SIZE = DEFAULTS.PAGE_SIZE;

/**
 * page+size 가 필수인 어드민 목록 엔드포인트 (쿼리스트링 제외 경로).
 * mappings 는 LIST 만 — stats/active/pending-deposit 등 하위 경로는 포함하지 않음.
 */
export const ADMIN_LIST_ENDPOINTS = Object.freeze({
  CLIENTS_WITH_MAPPING_INFO: API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
  MAPPINGS_LIST: API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
  CONSULTATION_MESSAGES_ALL: '/api/v1/consultation-messages/all'
});

const ADMIN_LIST_ENDPOINT_PATHS = Object.freeze(
  new Set(Object.values(ADMIN_LIST_ENDPOINTS))
);

/**
 * URL 에서 쿼리를 제거하고 경로만 반환한다.
 *
 * @param {string} url
 * @returns {string}
 */
export function normalizeAdminListEndpoint(url) {
  if (url == null || typeof url !== 'string') {
    return '';
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  const withoutQuery = trimmed.split('?')[0];
  if (withoutQuery.startsWith('http://') || withoutQuery.startsWith('https://')) {
    try {
      return new URL(withoutQuery).pathname;
    } catch (e) {
      return withoutQuery;
    }
  }
  return withoutQuery;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isAdminListEndpoint(url) {
  return ADMIN_LIST_ENDPOINT_PATHS.has(normalizeAdminListEndpoint(url));
}

/**
 * 쿼리 파라미터에 page·size 를 항상 넣는다. caller 오버라이드 허용, 생략 불가.
 *
 * @param {Record<string, unknown>} [extra={}]
 * @returns {Record<string, unknown>}
 */
export function buildAdminListParams(extra = {}) {
  const source = extra && typeof extra === 'object' ? { ...extra } : {};
  const rawPage = source.page;
  const rawSize = source.size;
  let page = rawPage != null && rawPage !== '' ? Number(rawPage) : ADMIN_LIST_DEFAULT_PAGE;
  let size = rawSize != null && rawSize !== '' ? Number(rawSize) : ADMIN_LIST_DEFAULT_SIZE;
  if (!Number.isFinite(page)) {
    page = ADMIN_LIST_DEFAULT_PAGE;
  }
  if (!Number.isFinite(size)) {
    size = ADMIN_LIST_DEFAULT_SIZE;
  }
  return {
    ...source,
    page,
    size
  };
}

/**
 * endpoint 에 이미 붙어 있는 쿼리를 객체로 파싱한다.
 *
 * @param {string} endpoint
 * @returns {Record<string, string>}
 */
function parseQueryFromEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.includes('?')) {
    return {};
  }
  const qs = endpoint.slice(endpoint.indexOf('?') + 1);
  if (!qs) {
    return {};
  }
  return Object.fromEntries(new URLSearchParams(qs));
}

/**
 * DEV 에서 bare URL 에 page/size 누락 시 경고.
 *
 * @param {string} endpoint
 */
function warnIfBareUrlMissingPagination(endpoint) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  if (typeof endpoint !== 'string' || !endpoint.includes('?')) {
    return;
  }
  const qs = endpoint.slice(endpoint.indexOf('?') + 1);
  const hasPage = /(?:^|&)page=/.test(qs);
  const hasSize = /(?:^|&)size=/.test(qs);
  if (!hasPage || !hasSize) {
    console.warn(
      '[adminListFetch] URL query missing page/size — params will be forced:',
      endpoint
    );
  }
}

/**
 * StandardizedApi.get 래퍼 — 항상 page+size 포함.
 * ADMIN_LIST_ENDPOINTS 이면 강제. 그 외에도 adminListGet 경유 시 동일하게 강제.
 *
 * @param {string} endpoint
 * @param {Record<string, unknown>} [params={}]
 * @param {Record<string, unknown>} [options={}]
 * @returns {Promise<unknown>}
 */
export function adminListGet(endpoint, params = {}, options = {}) {
  warnIfBareUrlMissingPagination(endpoint);
  const cleanEndpoint = normalizeAdminListEndpoint(endpoint);
  const fromUrl = parseQueryFromEndpoint(endpoint);
  const merged = {
    ...fromUrl,
    ...(params && typeof params === 'object' ? params : {})
  };
  const finalParams = buildAdminListParams(merged);
  return StandardizedApi.get(cleanEndpoint, finalParams, options);
}

/**
 * @param {Record<string, unknown>} [params={}]
 * @param {Record<string, unknown>} [options={}]
 * @returns {Promise<unknown>}
 */
export function fetchClientsWithMappingInfo(params = {}, options = {}) {
  return adminListGet(ADMIN_LIST_ENDPOINTS.CLIENTS_WITH_MAPPING_INFO, params, options);
}

/**
 * @param {Record<string, unknown>} [params={}]
 * @param {Record<string, unknown>} [options={}]
 * @returns {Promise<unknown>}
 */
export function fetchAdminMappingsList(params = {}, options = {}) {
  return adminListGet(ADMIN_LIST_ENDPOINTS.MAPPINGS_LIST, params, options);
}

/**
 * @param {Record<string, unknown>} [params={}]
 * @param {Record<string, unknown>} [options={}]
 * @returns {Promise<unknown>}
 */
export function fetchAdminConsultationMessagesAll(params = {}, options = {}) {
  return adminListGet(ADMIN_LIST_ENDPOINTS.CONSULTATION_MESSAGES_ALL, params, options);
}
