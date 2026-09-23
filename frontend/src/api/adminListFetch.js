/**
 * Admin 목록 API 공통 fetch — page/size SSOT 강제.
 *
 * bare `...?view=summary` 또는 page/size 없는 LIST 호출을 금지한다.
 * 기본값: {@link ADMIN_DASHBOARD_LIST_PAGE} / {@link ADMIN_DASHBOARD_LIST_PAGE_SIZE}.
 *
 * P0 SSOT: callers must use adminClientsWithMappingGet / adminListGet — never bare view=summary.
 * 전체 페이지 drain: {@link adminListGetAllPages} / {@link adminMappingsListGetAll}
 * / {@link adminSchedulesListGetAll} / {@link adminScheduleControllerListGetAll}.
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
  API_ADMIN_SCHEDULES,
  API_SCHEDULE_CONTROLLER_ADMIN
} from '../constants/adminDashboardWidgetConstants';

/** Bundle contenthash bump — P0 bare view=summary purge (2026-09-22). */
export const ADMIN_LIST_FETCH_MARKER = 'p0-bare-purge-20260922';

/**
 * BE AdminController.ADMIN_LIST_MAX_PAGE_SIZE(200) 와 정합.
 * GetAll drain 기본 size — round-trip 최소화 (전역 PaginationUtils 50 아님).
 */
export const ADMIN_LIST_DRAIN_PAGE_SIZE = 200;

/** adminListGetAllPages 안전 상한 — 무한 루프 방지. */
export const ADMIN_LIST_GET_ALL_MAX_PAGES = 500;

/** 기본 목록 키 후보 (envelope 객체). */
const ADMIN_LIST_ITEM_KEYS = Object.freeze(['mappings', 'content', 'items', 'data', 'schedules']);

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
 * 응답에서 목록 배열과 envelope 키를 추출한다.
 *
 * @param {*} response
 * @returns {{ items: Array<*>, listKey: string|null }}
 */
function defaultGetAdminListItems(response) {
  if (response == null) {
    return { items: [], listKey: null };
  }
  if (Array.isArray(response)) {
    return { items: response, listKey: null };
  }
  if (typeof response !== 'object') {
    return { items: [], listKey: null };
  }
  for (let i = 0; i < ADMIN_LIST_ITEM_KEYS.length; i += 1) {
    const key = ADMIN_LIST_ITEM_KEYS[i];
    if (Array.isArray(response[key])) {
      return { items: response[key], listKey: key };
    }
  }
  return { items: [], listKey: null };
}

/**
 * 응답에서 전체 건수를 추출한다.
 *
 * @param {*} response
 * @returns {number|undefined}
 */
function defaultGetAdminListTotal(response) {
  if (response == null || typeof response !== 'object' || Array.isArray(response)) {
    return undefined;
  }
  const raw = response.totalElements ?? response.count ?? response.total;
  if (raw == null || raw === '') {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * custom getItems 결과와 응답을 대조해 envelope 목록 키를 추론한다.
 *
 * @param {*} response
 * @param {Array<*>} items
 * @returns {string|null}
 */
function inferAdminListKey(response, items) {
  if (response == null || typeof response !== 'object' || Array.isArray(response)) {
    return null;
  }
  for (let i = 0; i < ADMIN_LIST_ITEM_KEYS.length; i += 1) {
    const key = ADMIN_LIST_ITEM_KEYS[i];
    if (response[key] === items || Array.isArray(response[key])) {
      if (response[key] === items) {
        return key;
      }
    }
  }
  for (let i = 0; i < ADMIN_LIST_ITEM_KEYS.length; i += 1) {
    const key = ADMIN_LIST_ITEM_KEYS[i];
    if (Array.isArray(response[key])) {
      return key;
    }
  }
  return null;
}

/**
 * Admin 목록 전체 페이지 drain — 각 페이지는 반드시 {@link adminListGet} 경유 (page+size 강제).
 *
 * 종료 조건: collected >= total / 빈 페이지 / items.length &lt; size / maxPages 상한.
 *
 * @param {string} path
 * @param {Object} [options={}]
 * @param {Object} [apiOptions={}]
 * @param {Object} [listConfig={}]
 * @param {function(*): Array<*>} [listConfig.getItems]
 * @param {function(*): number|undefined|null} [listConfig.getTotal]
 * @param {string} [listConfig.listKey]
 * @param {number} [listConfig.maxPages]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export async function adminListGetAllPages(path, options = {}, apiOptions = {}, listConfig = {}) {
  const config = listConfig || {};
  const maxPages = Number.isFinite(Number(config.maxPages)) && Number(config.maxPages) > 0
    ? Number(config.maxPages)
    : ADMIN_LIST_GET_ALL_MAX_PAGES;
  const baseOptions = { ...(options || {}) };
  const startPage = baseOptions.page != null && baseOptions.page !== ''
    ? Number(baseOptions.page)
    : ADMIN_DASHBOARD_LIST_PAGE;
  const pageSize = baseOptions.size != null && baseOptions.size !== ''
    ? Number(baseOptions.size)
    : ADMIN_LIST_DRAIN_PAGE_SIZE;

  const allItems = [];
  let firstResponse = null;
  let lastResponse = null;
  let listKey = typeof config.listKey === 'string' ? config.listKey : null;
  let total;

  for (let i = 0; i < maxPages; i += 1) {
    const page = startPage + i;
    const response = await adminListGet(
      path,
      { ...baseOptions, page, size: pageSize },
      apiOptions
    );
    if (firstResponse == null) {
      firstResponse = response;
    }
    lastResponse = response;

    let items;
    if (typeof config.getItems === 'function') {
      const extracted = config.getItems(response);
      items = Array.isArray(extracted) ? extracted : [];
      if (listKey == null) {
        listKey = inferAdminListKey(response, items);
      }
    } else {
      const extracted = defaultGetAdminListItems(response);
      items = extracted.items;
      if (listKey == null) {
        listKey = extracted.listKey;
      }
    }

    if (typeof config.getTotal === 'function') {
      const rawTotal = config.getTotal(response);
      if (rawTotal != null && rawTotal !== '') {
        const n = Number(rawTotal);
        if (Number.isFinite(n)) {
          total = n;
        }
      }
    } else {
      const n = defaultGetAdminListTotal(response);
      if (n != null) {
        total = n;
      }
    }

    if (items.length === 0) {
      break;
    }
    allItems.push(...items);

    if (total != null && allItems.length >= total) {
      break;
    }
    if (items.length < pageSize) {
      break;
    }
  }

  if (firstResponse == null) {
    if (listKey) {
      return { [listKey]: [], count: 0, page: startPage, size: pageSize };
    }
    return [];
  }

  if (Array.isArray(firstResponse) || listKey == null) {
    return allItems;
  }

  const envelope = {
    ...(typeof firstResponse === 'object' && !Array.isArray(firstResponse) ? firstResponse : {})
  };
  if (lastResponse != null && typeof lastResponse === 'object' && !Array.isArray(lastResponse)) {
    if (lastResponse.page != null) {
      envelope.page = lastResponse.page;
    }
    if (lastResponse.size != null) {
      envelope.size = lastResponse.size;
    }
  }
  envelope[listKey] = allItems;
  const resolvedTotal = total != null ? total : allItems.length;
  if (Object.prototype.hasOwnProperty.call(envelope, 'totalElements')
      || (lastResponse != null && Object.prototype.hasOwnProperty.call(lastResponse, 'totalElements'))) {
    envelope.totalElements = resolvedTotal;
  }
  envelope.count = resolvedTotal;
  return envelope;
}

/**
 * mappings LIST 전체 페이지 drain (page/size SSOT).
 * 단일 페이지는 {@link adminMappingsListGet} 유지.
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function adminMappingsListGetAll(extra = {}, apiOptions = {}) {
  return adminListGetAllPages(
    API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
    {
      ...ADMIN_MAPPINGS_PAGED_LIST_QUERY,
      size: ADMIN_LIST_DRAIN_PAGE_SIZE,
      ...(extra || {})
    },
    apiOptions,
    {
      listKey: 'mappings',
      getItems: (r) => (r && Array.isArray(r.mappings) ? r.mappings : []),
      getTotal: (r) => (r == null ? undefined : (r.totalElements ?? r.count))
    }
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

/**
 * schedules LIST 전체 페이지 drain (page/size SSOT).
 * 단일 페이지는 {@link adminSchedulesListGet} 유지.
 * getItems: r.schedules / getTotal: r.totalElements ?? r.count
 *
 * extra 에 startDate/endDate(yyyy-MM-dd) 를 넘기면 월 스코프 drain 가능
 * (IMS cold-load: 표시 월만 — unbounded 전체 스케줄 dump 금지).
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function adminSchedulesListGetAll(extra = {}, apiOptions = {}) {
  return adminListGetAllPages(
    API_ADMIN_SCHEDULES,
    {
      ...ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY,
      size: ADMIN_LIST_DRAIN_PAGE_SIZE,
      ...(extra || {})
    },
    apiOptions,
    {
      listKey: 'schedules',
      getItems: (r) => (r && Array.isArray(r.schedules) ? r.schedules : []),
      getTotal: (r) => (r == null ? undefined : (r.totalElements ?? r.count))
    }
  );
}

/**
 * ScheduleController {@code GET /api/v1/schedules/admin} 전체 페이지 drain.
 *
 * <p>AdminController {@link adminSchedulesListGetAll}(/api/v1/admin/schedules) 와 경로·기본
 * status 필터가 다름 — 통합 캘린더(월 스코프 ASC)는 이 헬퍼만 사용.</p>
 *
 * extra: consultantId / startDate / endDate / status / _t(invalidationKey) 등.
 * size 기본 {@link ADMIN_LIST_DRAIN_PAGE_SIZE}(200).
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function adminScheduleControllerListGetAll(extra = {}, apiOptions = {}) {
  return adminListGetAllPages(
    API_SCHEDULE_CONTROLLER_ADMIN,
    {
      size: ADMIN_LIST_DRAIN_PAGE_SIZE,
      ...(extra || {})
    },
    apiOptions,
    {
      listKey: 'schedules',
      getItems: (r) => (r && Array.isArray(r.schedules) ? r.schedules : []),
      getTotal: (r) => (r == null ? undefined : (r.totalElements ?? r.count))
    }
  );
}
