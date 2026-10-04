/**
 * runResourceLoad + softRefresh 바인딩.
 * Initial: load({ silent: false }) → setLoading.
 * Mutation/focus: softRefresh() → silent, 레이아웃 blank 없음.
 *
 * 겹친 blocking load 는 마지막 호출만 loading 을 내린다 (앞선 호출 완료가 진행 중 로딩을 끄지 않음).
 * 언마운트 뒤 완료된 요청은 loading 을 건드리지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useCallback, useEffect, useRef } from 'react';
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
  const mountedRef = useRef(true);
  const blockingSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async(options = {}) => {
      const silent = options?.silent === true;
      const seq = silent ? blockingSeqRef.current : blockingSeqRef.current + 1;
      if (!silent) {
        blockingSeqRef.current = seq;
      }
      const setLoadingForThisCall = (value) => {
        if (!mountedRef.current || typeof setLoading !== 'function') {
          return;
        }
        if (value === false && seq !== blockingSeqRef.current) {
          return;
        }
        setLoading(value);
      };
      return runResourceLoad(options, setLoadingForThisCall, () => loaderRef.current());
    },
    [setLoading]
  );

  const softRefresh = useCallback(
    (options = {}) => softRefreshUtil(load, options),
    [load]
  );

  return { load, softRefresh };
}

export default useSoftResourceLoad;
