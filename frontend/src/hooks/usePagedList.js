/**
 * page/size 목록 + 더 보기(append) 공통 훅.
 *
 * - 서버 page 0부터, size 고정 (관리자 목록 adminListFetch 와 같은 기준).
 * - 첫 페이지만 blocking loading. 더 보기는 loadingMore 로 따로 표시한다.
 * - enabled 가 false 이면 요청하지 않는다 (세션 준비 전 등).
 * - 늦게 끝난 이전 요청(재조회·언마운트)은 상태를 덮지 않고, loading 도 마지막 요청만 내린다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CLIENT_LIST_PAGE_SIZE, PAGED_LIST_FIRST_PAGE } from '../constants/pagedList';
import { hasMorePagedItems, normalizePagedListPayload } from '../utils/pagedListPayload';

/**
 * @param {object} params
 * @param {(page: number, size: number) => Promise<unknown>} params.fetchPage 서버 page/size 조회 (응답 원본 반환)
 * @param {number} [params.pageSize]
 * @param {boolean} [params.enabled=true]
 * @param {unknown} [params.resetKey] 바뀌면 첫 페이지부터 다시 읽는다 (예: userId)
 * @param {{ itemKeys?: ReadonlyArray<string> }} [params.normalizeOptions]
 * @returns {{
 *   items: Array<any>,
 *   setItems: (updater: Array<any>|((prev: Array<any>) => Array<any>)) => void,
 *   totalElements: number|null,
 *   loading: boolean,
 *   loadingMore: boolean,
 *   error: unknown,
 *   hasMore: boolean,
 *   loadMore: () => Promise<void>,
 *   reload: (options?: { silent?: boolean }) => Promise<void>
 * }}
 */
export function usePagedList({
  fetchPage,
  pageSize = CLIENT_LIST_PAGE_SIZE,
  enabled = true,
  resetKey,
  normalizeOptions
}) {
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
      setItems(result.items);
      setLastPage(PAGED_LIST_FIRST_PAGE);
      setLastPageCount(result.items.length);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
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
      }
    } finally {
      if (isCurrent(seq)) {
        setLoading(false);
      }
    }
  }, [readPage]);

  const hasMore = hasMorePagedItems({
    loadedCount: items.length,
    lastPage,
    lastPageCount,
    pageSize,
    totalElements,
    totalPages
  });

  const loadMore = useCallback(async() => {
    if (loadingMoreRef.current || !hasMore) {
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
      setItems((prev) => [...prev, ...result.items]);
      setLastPage(nextPage);
      setLastPageCount(result.items.length);
      if (result.totalElements != null) {
        setTotalElements(result.totalElements);
      }
      if (result.totalPages != null) {
        setTotalPages(result.totalPages);
      }
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
  }, [hasMore, lastPage, readPage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage 는 ref; resetKey·enabled 만 재조회 키
  }, [enabled, resetKey, pageSize]);

  return {
    items,
    setItems,
    totalElements,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload
  };
}

export default usePagedList;
