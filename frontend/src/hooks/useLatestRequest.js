/**
 * 최신 요청만 state 에 반영하기 위한 훅.
 * ConsultationLogViewPage / ConsultantDashboardV2 requestId 패턴을 공통화한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import { useCallback, useEffect, useRef } from 'react';
import { createLatestRequestGuard } from '../utils/latestRequestGuard';

/**
 * @returns {() => import('../utils/latestRequestGuard').LatestRequestHandle}
 */
export function useLatestRequest() {
  const guardRef = useRef(null);
  if (guardRef.current == null) {
    guardRef.current = createLatestRequestGuard();
  }

  useEffect(() => {
    const guard = guardRef.current;
    return () => {
      guard.abort();
    };
  }, []);

  return useCallback(() => guardRef.current.begin(), []);
}

export default useLatestRequest;
