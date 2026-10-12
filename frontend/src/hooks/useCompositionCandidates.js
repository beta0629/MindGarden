/**
 * 상품 구성 후보(몰 판매 중 SKU) 검색 훅 — 검색어 디바운스 + `{items, totalActive}` 상태.
 * 빈 검색어도 전체 후보를 불러온다. 「후보 없음」은 totalActive 기준.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import { useCallback, useEffect, useState } from 'react';
import useDebounce from './useDebounce';
import { listCompositionCandidates } from '../services/adminShopCompositionService';
import { mapCompositionCandidate } from '../utils/packageComposition';

/** 검색어 디바운스(ms) — 관리자 검색 공통값과 같음 */
export const COMPOSITION_SEARCH_DEBOUNCE_MS = 300;

/** 후보 조회 상태 */
export const COMPOSITION_FETCH_STATUS = Object.freeze({
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR'
});

/**
 * @param {{ query: string, excludePackageCode?: string, enabled?: boolean }} args
 * @returns {{ candidates: Array<object>, totalActive: number, status: string, retry: Function }}
 */
export default function useCompositionCandidates({ query, excludePackageCode = '', enabled = true }) {
  const debounced = useDebounce(String(query || '').trim(), COMPOSITION_SEARCH_DEBOUNCE_MS);
  const [state, setState] = useState({ candidates: [], totalActive: 0, status: COMPOSITION_FETCH_STATUS.IDLE });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: COMPOSITION_FETCH_STATUS.LOADING }));
    listCompositionCandidates({ q: debounced, excludePackageCode })
      .then((res) => {
        if (!cancelled) {
          setState({
            candidates: res.items.map(mapCompositionCandidate),
            totalActive: res.totalActive,
            status: COMPOSITION_FETCH_STATUS.READY
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, status: COMPOSITION_FETCH_STATUS.ERROR }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, excludePackageCode, enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
