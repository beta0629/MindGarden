/**
 * 상담사 본인 일지 미작성 건수 — 대시보드와 동일한 기존 엔드포인트(읽기 전용) 재사용
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import { useCallback, useEffect, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { DASHBOARD_API } from '../constants/api';

/**
 * @param {Object|null|undefined} data
 * @returns {number}
 */
export const resolveIncompleteRecordCount = (data) => {
  if (data == null || typeof data !== 'object') {
    return 0;
  }
  const list = Array.isArray(data.records)
    ? data.records
    : (Array.isArray(data.schedules) ? data.schedules : []);
  const n = Number(data.count ?? list.length);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * @param {number|string|null|undefined} consultantId
 * @returns {{ count: number|null, loading: boolean, reload: () => Promise<void> }}
 */
export default function useConsultantIncompleteRecordCount(consultantId) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async() => {
    if (!consultantId) {
      return;
    }
    setLoading(true);
    try {
      const data = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_INCOMPLETE_RECORDS(consultantId));
      setCount(resolveIncompleteRecordCount(data));
    } catch (e) {
      setCount(null);
    } finally {
      setLoading(false);
    }
  }, [consultantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { count, loading, reload };
}
