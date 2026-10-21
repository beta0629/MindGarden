/**
 * page/size 목록 공통 훅.
 *
 * - 서버 page 0부터, size 고정 (관리자 목록 adminListFetch 와 같은 기준).
 * - mode=append(기본): 더 보기로 이어 붙인다. 첫 페이지만 blocking loading.
 * - mode=replace: goToPage(1-based) 로 현재 페이지만 교체한다 (MGPagination).
 * - enabled 가 false 이면 요청하지 않는다 (세션 준비 전 등).
 * - 늦게 끝난 이전 요청(재조회·언마운트)은 상태를 덮지 않고, loading 도 마지막 요청만 내린다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CLIENT_LIST_PAGE_SIZE,
  PAGED_LIST_FIRST_PAGE,
  PAGED_LIST_MODE
} from '../constants/pagedList';
import { hasMorePagedItems, normalizePagedListPayload } from '../utils/pagedListPayload';

/**
 * @param {object} params
 * @param {(page: number, size: number) => Promise<unknown>} params.fetchPage 서버 page/size 조회 (응답 원본 반환)
 * @param {number} [params.pageSize]
 * @param {boolean} [params.enabled=true]
 * @param {unknown} [params.resetKey] 바뀌면 첫 페이지부터 다시 읽는다 (예: userId)
 * @param {{ itemKeys?: ReadonlyArray<string> }} [params.normalizeOptions]
 * @param {'append'|'replace'} [params.mode='append']
 * @returns {{
 *   items: Array<any>,
 *   setItems: (updater: Array<any>|((prev: Array<any>) => Array<any>)) => void,
 *   totalElements: number|null,
 *   totalPages: number|null,
 *   currentPage: number,
 *   loading: boolean,
 *   loadingMore: boolean,
 *   error: unknown,
 *   hasMore: boolean,
 *   loadMore: () => Promise<void>,
 *   goToPage: (page1Based: number) => Promise<void>,
 *   reload: (options?: { silent?: boolean }) => Promise<void>
 * }}
 */
export function usePagedList({
  fetchPage,
  pageSize = CLIENT_LIST_PAGE_SIZE,
  enabled = true,
  resetKey,
  normalizeOptions,
  mode = PAGED_LIST_MODE.APPEND
}) {
  const replaceMode = mode === PAGED_LIST_MODE.REPLACE;
  const [items, setItems] = useState([]);
  const [lastPage, setLastPage] = useState(PAGED_LIST_FIRST_PAGE);
  const [lastPageCount, setLastPageCount] = useState(0);
  const [totalElements, setTotalElements] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;
  const normalizeOptionsRef = useRef(normalizeOptions);
  normalizeOptionsRef.current = normalizeOptions;
  const seqRef = useRef(0);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isCurrent = (seq) => mountedRef.current && seq === seqRef.current;

  const readPage = useCallback(async(page) => {
    const raw = await fetchPageRef.current(page, pageSize);
    return normalizePagedListPayload(raw, normalizeOptionsRef.current || {});
  }, [pageSize]);

  const applyPageResult = useCallback((page0, result, { append }) => {
    setItems((prev) => (append ? [...prev, ...result.items] : result.items));
    setLastPage(page0);
    setLastPageCount(result.items.length);
    if (result.totalElements != null) {
      setTotalElements(result.totalElements);
    }
    if (result.totalPages != null) {
      setTotalPages(result.totalPages);
    }
  }, []);

  const reload = useCallback(async(options = {}) => {
    const silent = options.silent === true;
    seqRef.current += 1;
    const seq = seqRef.current;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await readPage(PAGED_LIST_FIRST_PAGE);
      if (!isCurrent(seq)) {
        return;
      }
      applyPageResult(PAGED_LIST_FIRST_PAGE, result, { append: false });
    } catch (err) {
      if (!isCurrent(seq)) {
        return;
      }
      setError(err || new Error('list load failed'));
      if (!silent) {
        setItems([]);
        setTotalElements(null);
        setTotalPages(null);
        setLastPageCount(0);
        setLastPage(PAGED_LIST_FIRST_PAGE);
      }
    } finally {
      if (isCurrent(seq)) {
        setLoading(false);
      }
    }
  }, [applyPageResult, readPage]);

  const hasMore = hasMorePagedItems({
    loadedCount: items.length,
    lastPage,
    lastPageCount,
    pageSize,
    totalElements,
    totalPages
  });

  const loadMore = useCallback(async() => {
    if (replaceMode || loadingMoreRef.current || !hasMore) {
      return;
    }
    const seq = seqRef.current;
    const nextPage = lastPage + 1;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const result = await readPage(nextPage);
      if (!isCurrent(seq)) {
        return;
      }
      applyPageResult(nextPage, result, { append: true });
    } catch (err) {
      if (isCurrent(seq)) {
        setError(err || new Error('list load more failed'));
      }
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [applyPageResult, hasMore, lastPage, readPage, replaceMode]);

  const goToPage = useCallback(async(page1Based) => {
    if (!replaceMode) {
      return;
    }
    const page0 = Math.floor(Number(page1Based)) - 1;
    if (!Number.isFinite(page0) || page0 < PAGED_LIST_FIRST_PAGE) {
      return;
    }
    if (page0 === lastPage && items.length > 0 && !error) {
      return;
    }
    seqRef.current += 1;
    const seq = seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await readPage(page0);
      if (!isCurrent(seq)) {
        return;
      }
      applyPageResult(page0, result, { append: false });
    } catch (err) {
      if (!isCurrent(seq)) {
        return;
      }
      setError(err || new Error('list page load failed'));
      setItems([]);
      setTotalElements(null);
      setTotalPages(null);
      setLastPageCount(0);
    } finally {
      if (isCurrent(seq)) {
        setLoading(false);
      }
    }
  }, [applyPageResult, error, items.length, lastPage, readPage, replaceMode]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage 는 ref; resetKey·enabled·mode·pageSize 만 재조회 키
  }, [enabled, resetKey, pageSize, mode]);

  const resolvedTotalPages = totalPages != null
    ? totalPages
    : (totalElements != null ? Math.max(1, Math.ceil(totalElements / pageSize)) : null);

  return {
    items,
    setItems,
    totalElements,
    totalPages: resolvedTotalPages,
    currentPage: lastPage + 1,
    loading,
    loadingMore,
    error,
    hasMore: replaceMode ? false : hasMore,
    loadMore,
    goToPage,
    reload
  };
}

export default usePagedList;
