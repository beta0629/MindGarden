import { useState, useCallback } from 'react';

/**
 * ERP 화면에서 목록 무음(silent) 재조회 시 MGButton loading·인라인 스피너용 상태.
 *
 * @param {boolean} [initial=false] 초기값
 * @returns {object} silentListRefreshing, setSilentListRefreshing, runSilentListRefresh
 * @author CoreSolution
 * @since 2026-04-11
 */
export function useErpSilentRefresh(initial = false) {
  const [silentListRefreshing, setSilentListRefreshing] = useState(initial);

  const runSilentListRefresh = useCallback(async(fn) => {
    setSilentListRefreshing(true);
    try {
      await fn();
    } finally {
      setSilentListRefreshing(false);
    }
  }, []);

  return { silentListRefreshing, setSilentListRefreshing, runSilentListRefresh };
}
