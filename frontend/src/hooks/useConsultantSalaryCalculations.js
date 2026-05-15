/**
 * 상담사 급여 정산 목록(게이트·화면 공용)
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadConsultantSalaryCalculations,
  invalidateConsultantSalaryCalculationsCache
} from '../api/consultantSalaryCalculationsClient';

/**
 * @returns {{
 *   items: Array<Object>,
 *   loading: boolean,
 *   error: Error|null,
 *   hasItems: boolean,
 *   refetch: () => Promise<void>
 * }}
 */
export function useConsultantSalaryCalculations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async(force) => {
    if (force) {
      invalidateConsultantSalaryCalculationsCache();
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loadConsultantSalaryCalculations();
      if (res.source === 'error' && res.error) {
        setError(res.error);
      }
      setItems(res.items || []);
    } catch (e) {
      setError(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run(false);
  }, [run]);

  const refetch = useCallback(async() => {
    await run(true);
  }, [run]);

  return {
    items,
    loading,
    error,
    hasItems: items.length > 0,
    refetch
  };
}
