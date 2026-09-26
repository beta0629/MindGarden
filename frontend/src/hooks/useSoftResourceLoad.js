/**
 * runResourceLoad + softRefresh 바인딩.
 * Initial: load({ silent: false }) → setLoading.
 * Mutation/focus: softRefresh() → silent, 레이아웃 blank 없음.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useCallback, useRef } from 'react';
import { runResourceLoad, softRefresh as softRefreshUtil } from '../utils/softRefresh';

/**
 * @param {(value: boolean) => void} setLoading
 * @param {() => Promise<unknown>} loader — 순수 데이터 fetch (loading 토글 금지)
 * @returns {{
 *   load: (options?: { silent?: boolean } & Record<string, unknown>) => Promise<unknown>,
 *   softRefresh: (options?: Record<string, unknown>) => Promise<unknown>
 * }}
 */
export function useSoftResourceLoad(setLoading, loader) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(
    async(options = {}) => runResourceLoad(options, setLoading, () => loaderRef.current()),
    [setLoading]
  );

  const softRefresh = useCallback(
    (options = {}) => softRefreshUtil(load, options),
    [load]
  );

  return { load, softRefresh };
}

export default useSoftResourceLoad;
