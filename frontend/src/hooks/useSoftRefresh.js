/**
 * softRefresh util 의 thin React 래퍼.
 * loadFn 에 바인딩된 silent refresh 콜백을 반환한다.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { useCallback } from 'react';
import { softRefresh as softRefreshUtil } from '../utils/softRefresh';

/**
 * @param {(options: { silent?: boolean } & Record<string, unknown>) => Promise<unknown>} loadFn
 * @returns {(options?: Record<string, unknown>) => Promise<unknown>}
 */
export function useSoftRefresh(loadFn) {
  return useCallback(
    (options = {}) => softRefreshUtil(loadFn, options),
    [loadFn]
  );
}

export default useSoftRefresh;
