/**
 * Admin 목록 API 공통 fetch — page/size SSOT 강제.
 *
 * bare `...?view=summary` 또는 page/size 없는 LIST 호출을 금지한다.
 * 기본값: {@link ADMIN_DASHBOARD_LIST_PAGE} / {@link ADMIN_DASHBOARD_LIST_PAGE_SIZE}.
 *
 * P0 SSOT: callers must use adminClientsWithMappingGet / adminListGet — never bare view=summary.
 * 전체 페이지 drain: {@link adminListGetAllPages} / {@link adminMappingsListGetAll}
 * / {@link adminSchedulesListGetAll} / {@link adminClientsWithMappingGetAll}.
 * clients 키는 {@link ADMIN_LIST_ITEM_KEYS} 기본 후보에 포함 (listConfig 생략 시에도 추출).
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

/** Bundle contenthash bump — P0 clients.length === count (size=total fast-path). */
export const ADMIN_LIST_FETCH_MARKER = 'p0-clients-size-eq-count-20260923';

/** Alias for callers/docs that use BUILD_MARKER naming. */
export const ADMIN_LIST_FETCH_BUILD_MARKER = ADMIN_LIST_FETCH_MARKER;

/** adminListGetAllPages 안전 상한 — 무한 루프 방지. */
export const ADMIN_LIST_GET_ALL_MAX_PAGES = 500;

/**
 * page0 불완전 시 size=total 단일 follow-up 허용 상한.
 * {@link ADMIN_LIST_GET_ALL_MAX_PAGES} 와 동일 (prod scale &lt;300 / count≤500).
 */
export const ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX = ADMIN_LIST_GET_ALL_MAX_PAGES;

/** 기본 목록 키 후보 (envelope 객체) — clients 포함해 listConfig 누락 시 [] 방지. */
const ADMIN_LIST_ITEM_KEYS = Object.freeze(['clients', 'mappings', 'content', 'items', 'data']);

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
 * with-mapping-info 전체 페이지 drain (page/size SSOT).
 * 단일 페이지는 {@link adminClientsWithMappingGet} 유지 (대시보드 KPI 등).
 * listKey: clients — count 우선 total + size=total fast-path.
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 * @author CoreSolution
 * @since 2026-09-23
 */
export function adminClientsWithMappingGetAll(extra = {}, apiOptions = {}) {
  return adminListGetAllPages(
    API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
    { ...ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY, ...(extra || {}) },
    apiOptions,
    {
      listKey: 'clients',
      getItems: (r) => extractAdminListItems(r).items,
      getTotal: (r) => extractAdminListTotal(r)
    }
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
 * 숫자 total 후보를 유한 number 로 변환한다.
 *
 * @param {*} raw
 * @returns {number|undefined}
 */
function coerceAdminListTotal(raw) {
  if (raw == null || raw === '') {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 응답에서 목록 배열과 envelope 키를 추출한다.
 * clients / data.clients / content / raw array + mappings/items/data 지원.
 *
 * @param {*} response
 * @returns {{ items: Array<*>, listKey: string|null }}
 */
function extractAdminListItems(response) {
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
      return { items: response[key], listKey: key === 'data' ? null : key };
    }
  }
  const nested = response.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    if (Array.isArray(nested.clients)) {
      return { items: nested.clients, listKey: 'clients' };
    }
    for (let i = 0; i < ADMIN_LIST_ITEM_KEYS.length; i += 1) {
      const key = ADMIN_LIST_ITEM_KEYS[i];
      if (key === 'data') {
        continue;
      }
      if (Array.isArray(nested[key])) {
        return { items: nested[key], listKey: key };
      }
    }
  }
  return { items: [], listKey: null };
}

/**
 * 응답에서 전체 건수를 추출한다.
 * BE with-mapping-info 는 count 가 TOTAL — totalElements 보다 count 우선
 * (중첩 data.count 도 top-level totalElements 보다 우선).
 *
 * @param {*} response
 * @returns {number|undefined}
 */
function extractAdminListTotal(response) {
  if (response == null || typeof response !== 'object' || Array.isArray(response)) {
    return undefined;
  }
  const nested = response.data != null && typeof response.data === 'object'
    && !Array.isArray(response.data)
    ? response.data
    : null;

  const topCount = coerceAdminListTotal(response.count);
  if (topCount != null) {
    return topCount;
  }
  if (nested != null) {
    const nestedCount = coerceAdminListTotal(nested.count);
    if (nestedCount != null) {
      return nestedCount;
    }
  }

  const topOther = coerceAdminListTotal(response.totalElements ?? response.total);
  if (topOther != null) {
    return topOther;
  }
  if (nested != null) {
    return coerceAdminListTotal(nested.totalElements ?? nested.total);
  }
  return undefined;
}

/** @deprecated use extractAdminListItems — listConfig 기본 경로 호환 */
function defaultGetAdminListItems(response) {
  return extractAdminListItems(response);
}

/** @deprecated use extractAdminListTotal — listConfig 기본 경로 호환 */
function defaultGetAdminListTotal(response) {
  return extractAdminListTotal(response);
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
    if (response[key] === items) {
      return key === 'data' ? null : key;
    }
  }
  for (let i = 0; i < ADMIN_LIST_ITEM_KEYS.length; i += 1) {
    const key = ADMIN_LIST_ITEM_KEYS[i];
    if (Array.isArray(response[key])) {
      return key === 'data' ? null : key;
    }
  }
  const nested = response.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)
      && Array.isArray(nested.clients) && nested.clients === items) {
    return 'clients';
  }
  return null;
}

/**
 * 한 응답에서 items / total / listKey 를 listConfig 규칙으로 해석한다.
 *
 * @param {*} response
 * @param {Object} config
 * @param {string|null} listKey
 * @returns {{ items: Array<*>, total: number|undefined, listKey: string|null }}
 */
function resolveAdminListPage(response, config, listKey) {
  let items;
  let nextKey = listKey;
  if (typeof config.getItems === 'function') {
    const extracted = config.getItems(response);
    items = Array.isArray(extracted) ? extracted : [];
    if (nextKey == null) {
      nextKey = inferAdminListKey(response, items);
    }
  } else {
    const extracted = defaultGetAdminListItems(response);
    items = extracted.items;
    if (nextKey == null) {
      nextKey = extracted.listKey;
    }
  }

  let total;
  if (typeof config.getTotal === 'function') {
    const rawTotal = config.getTotal(response);
    if (rawTotal != null && rawTotal !== '') {
      const n = Number(rawTotal);
      if (Number.isFinite(n)) {
        total = n;
      }
    }
  } else {
    total = defaultGetAdminListTotal(response);
  }

  return { items, total, listKey: nextKey };
}

/**
 * Admin 목록 전체 페이지 drain — 각 페이지는 반드시 {@link adminListGet} 경유 (page+size 강제).
 *
 * 전략:
 * 1) page0 조회
 * 2) total &gt; items.length 이고 total ≤ {@link ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX} 이면
 *    size=total 단일 follow-up 우선 (clients.length === count 목표)
 * 3) size 무시 등으로 불완전하면 기존 multi-page drain 폴백
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
    : ADMIN_DASHBOARD_LIST_PAGE_SIZE;

  const firstResponse = await adminListGet(
    path,
    { ...baseOptions, page: startPage, size: pageSize },
    apiOptions
  );

  let listKey = typeof config.listKey === 'string' ? config.listKey : null;
  const resolved = resolveAdminListPage(firstResponse, config, listKey);
  listKey = resolved.listKey;
  let total = resolved.total;
  let allItems = resolved.items.slice();
  let lastResponse = firstResponse;

  const needsMore = () => total != null && allItems.length < total;

  if (allItems.length > 0 && needsMore()
      && total <= ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX) {
    const fullResponse = await adminListGet(
      path,
      { ...baseOptions, page: startPage, size: total },
      apiOptions
    );
    lastResponse = fullResponse;
    const fullResolved = resolveAdminListPage(fullResponse, config, listKey);
    if (fullResolved.listKey != null) {
      listKey = fullResolved.listKey;
    }
    if (fullResolved.total != null) {
      total = fullResolved.total;
    }
    if (fullResolved.items.length >= (total != null ? total : 0)
        || fullResolved.items.length > allItems.length) {
      allItems = fullResolved.items.slice();
    }
  }

  if (allItems.length > 0 && needsMore() && allItems.length >= pageSize) {
    for (let i = 1; i < maxPages; i += 1) {
      const page = startPage + i;
      const response = await adminListGet(
        path,
        { ...baseOptions, page, size: pageSize },
        apiOptions
      );
      lastResponse = response;
      const pageResolved = resolveAdminListPage(response, config, listKey);
      if (pageResolved.listKey != null) {
        listKey = pageResolved.listKey;
      }
      if (pageResolved.total != null) {
        total = pageResolved.total;
      }
      if (pageResolved.items.length === 0) {
        break;
      }
      allItems.push(...pageResolved.items);
      if (total != null && allItems.length >= total) {
        break;
      }
      if (pageResolved.items.length < pageSize) {
        break;
      }
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
    { ...ADMIN_MAPPINGS_PAGED_LIST_QUERY, ...(extra || {}) },
    apiOptions,
    {
      listKey: 'mappings',
      getItems: (r) => extractAdminListItems(r).items,
      getTotal: (r) => extractAdminListTotal(r)
    }
  );
}
/**
 * clients with-stats LIST (page/size SSOT).
 * bare `/clients/with-stats` (no page/size) 금지 — Validation FAIL 방지.
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminClientsWithStatsGet(extra = {}, apiOptions = {}) {
  return adminListGet(
    API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS,
    { ...(extra || {}) },
    apiOptions
  );
}

/**
 * consultants with-stats LIST (page/size SSOT).
 *
 * @param {Object} [extra={}]
 * @param {Object} [apiOptions={}]
 * @returns {Promise<*>}
 */
export function adminConsultantsWithStatsGet(extra = {}, apiOptions = {}) {
  return adminListGet(
    API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_STATS,
    { ...(extra || {}) },
    apiOptions
  );
}

/**
 * Admin schedules LIST (page/size SSOT).
 * 가예약 기본 쿼리: {@link ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY}.
 * bare StandardizedApi.get + BOOKED/PENDING/TENTATIVE 금지.
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
 * getItems: schedules / getTotal: count 우선 (count ?? totalElements)
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
    { ...ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY, ...(extra || {}) },
    apiOptions,
    {
      listKey: 'schedules',
      getItems: (r) => (r && Array.isArray(r.schedules) ? r.schedules : []),
      getTotal: (r) => extractAdminListTotal(r)
    }
  );
}
