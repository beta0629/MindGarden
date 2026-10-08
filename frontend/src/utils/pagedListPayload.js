/**
 * page/size 목록 응답 정규화 — 배열·Spring Page·ApiResponse 엔벨로프·{ notifications|messages, totalElements } 혼용.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { PAGED_LIST_ITEM_KEYS } from '../constants/pagedList';

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function toNonNegativeIntOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * 총계 필드를 객체에서 읽는다 (totalElements → total → totalCount / totalPages).
 *
 * @param {object|null|undefined} obj
 * @returns {{ totalElements: number|null, totalPages: number|null }}
 */
function readTotals(obj) {
  if (obj == null || typeof obj !== 'object') {
    return { totalElements: null, totalPages: null };
  }
  return {
    totalElements: toNonNegativeIntOrNull(obj.totalElements ?? obj.total ?? obj.totalCount),
    totalPages: toNonNegativeIntOrNull(obj.totalPages)
  };
}

/**
 * @param {object} obj
 * @param {ReadonlyArray<string>} keys
 * @returns {Array<unknown>|null}
 */
function findItemArray(obj, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return null;
}

/**
 * @param {unknown} raw API 응답 (StandardizedApi 언랩 전·후 모두)
 * @param {{ itemKeys?: ReadonlyArray<string> }} [options]
 * @returns {{ items: Array<unknown>, totalElements: number|null, totalPages: number|null }}
 */
export function normalizePagedListPayload(raw, options = {}) {
  const itemKeys = options.itemKeys || PAGED_LIST_ITEM_KEYS;
  if (Array.isArray(raw)) {
    return { items: raw, totalElements: null, totalPages: null };
  }
  if (raw == null || typeof raw !== 'object') {
    return { items: [], totalElements: null, totalPages: null };
  }

  // ApiResponse 엔벨로프: { success, data: [...], totalElements } — 총계는 외곽
  if (Array.isArray(raw.data)) {
    const totals = readTotals(raw);
    return {
      items: raw.data.filter((item) => item != null),
      totalElements: totals.totalElements,
      totalPages: totals.totalPages
    };
  }

  const nested = raw.data && typeof raw.data === 'object' ? raw.data : null;
  const source = nested && findItemArray(nested, itemKeys) ? nested : raw;
  const items = findItemArray(source, itemKeys) || [];
  // 중첩 data 객체에 총계가 없으면 외곽 엔벨로프에서도 읽는다
  const sourceTotals = readTotals(source);
  const outerTotals = nested ? readTotals(raw) : { totalElements: null, totalPages: null };
  return {
    items: items.filter((item) => item != null),
    totalElements: sourceTotals.totalElements ?? outerTotals.totalElements,
    totalPages: sourceTotals.totalPages ?? outerTotals.totalPages
  };
}

/**
 * 다음 페이지가 있는지. 총계가 없으면 마지막 페이지가 꽉 찼는지로 판단한다.
 *
 * @param {{
 *   loadedCount: number,
 *   lastPage: number,
 *   lastPageCount: number,
 *   pageSize: number,
 *   totalElements: number|null,
 *   totalPages: number|null
 * }} state
 * @returns {boolean}
 */
export function hasMorePagedItems(state) {
  const { loadedCount, lastPage, lastPageCount, pageSize, totalElements, totalPages } = state;
  if (totalElements != null) {
    return loadedCount < totalElements;
  }
  if (totalPages != null) {
    return lastPage + 1 < totalPages;
  }
  return pageSize > 0 && lastPageCount >= pageSize;
}

export default {
  normalizePagedListPayload,
  hasMorePagedItems
};
