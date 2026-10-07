/**
 * 상담사 스위트 목록 API — page/size + normalizePagedListPayload (관리자 목록과 동일 SSOT).
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import StandardizedApi from './standardizedApi';
import { normalizePagedListPayload } from './pagedListPayload';
import { PAGED_LIST_FIRST_PAGE } from '../constants/pagedList';
import { CONSULTANT_SUITE_PAGE_SIZE } from '../constants/consultantSuite';

/**
 * @param {string} path
 * @param {Record<string, unknown>} [params]
 * @param {{ page?: number, size?: number, itemKeys?: ReadonlyArray<string> }} [options]
 * @returns {Promise<{ items: Array<unknown>, totalElements: number|null, totalPages: number|null, raw: unknown }>}
 */
export async function fetchConsultantSuitePagedList(path, params = {}, options = {}) {
  const page = Number.isFinite(Number(options.page))
    ? Number(options.page)
    : PAGED_LIST_FIRST_PAGE;
  const size = Number.isFinite(Number(options.size))
    ? Number(options.size)
    : CONSULTANT_SUITE_PAGE_SIZE;
  const raw = await StandardizedApi.get(path, {
    ...params,
    page,
    size
  });
  const normalized = normalizePagedListPayload(raw, {
    itemKeys: options.itemKeys
  });
  return {
    ...normalized,
    raw
  };
}

/**
 * UI 페이지(1-base) → 서버 page(0-base).
 *
 * @param {number} uiPage
 * @returns {number}
 */
export function toServerPageIndex(uiPage) {
  const n = Number(uiPage);
  if (!Number.isFinite(n) || n < 1) {
    return PAGED_LIST_FIRST_PAGE;
  }
  return Math.floor(n) - 1;
}
