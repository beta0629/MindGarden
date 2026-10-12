/**
 * 스크롤 컨테이너 끝에 닿으면 다음 페이지를 부르는 공통 훅 (페이지 단위 무한 스크롤).
 *
 * - usePagedList 의 loadMore·hasMore·loadingMore 와 함께 쓴다.
 * - 더 불러올 것이 없거나(hasMore=false) 이미 불러오는 중이면 부르지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import { useCallback } from 'react';
import { INFINITE_SCROLL_END_THRESHOLD_PX } from '../constants/pagedList';

/**
 * @param {object} params
 * @param {() => unknown} [params.onLoadMore]
 * @param {boolean} [params.hasMore=false]
 * @param {boolean} [params.loadingMore=false]
 * @param {number} [params.thresholdPx]
 * @returns {(event: { currentTarget: HTMLElement }) => void} onScroll 핸들러
 */
export function useScrollEndLoadMore({
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  thresholdPx = INFINITE_SCROLL_END_THRESHOLD_PX
}) {
  return useCallback((event) => {
    const el = event?.currentTarget;
    if (!el || typeof onLoadMore !== 'function' || !hasMore || loadingMore) {
      return;
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - thresholdPx) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loadingMore, thresholdPx]);
}

export default useScrollEndLoadMore;
