/**
 * 첫 로딩만 본문을 가린다.
 * 콘텐츠가 한 번 보인 뒤의 재조회·세션 ping 은 children 을 언마운트하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useRef } from 'react';

/**
 * @param {boolean} loading
 * @returns {boolean} true 이면 UnifiedLoading 으로 자식을 가린다
 */
export function useInitialOnlyBlockingLoading(loading) {
  const hasShownContentRef = useRef(false);
  if (!loading) {
    hasShownContentRef.current = true;
  }
  return Boolean(loading) && !hasShownContentRef.current;
}

export default useInitialOnlyBlockingLoading;
