/**
 * useMonthlyConsultantCounts — 월별 상담사 COMPLETED 카운트 공통 hook.
 *
 * Phase 3-B (R6 2026-06-06) — IntegratedMatchingSchedule + AdminDashboardV2
 * 두 화면이 동일 SSOT 의 월별 카운트를 동일 캐시 정책으로 사용하기 위해 추출.
 *
 * SSOT API: GET /api/v1/schedules/monthly-consultant-counts?year=YYYY&month=M
 *   응답: { year, month, counts: [{ consultantId, consultantName, count }] }
 *
 * 캐시 정책 (IntegratedMatchingSchedule §3-A 와 동등):
 *   - 키: `${tenantId}:${year}:${month}` (컴포넌트 스코프 useRef Map — 마운트 동안 유지)
 *   - tenantId 변경 시 캐시 reset (다른 테넌트 데이터 노출 차단)
 *   - cancelled 플래그로 unmount race 차단
 *   - 조용한 실패: API 오류 시 빈 Map + 토스트 미발동
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import { useEffect, useRef, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { useSession } from '../contexts/SessionContext';

const MONTHLY_CONSULTANT_COUNTS_ENDPOINT = '/api/v1/schedules/monthly-consultant-counts';

const buildCacheKey = (tenantId, year, month) =>
    `${tenantId ?? 'unknown'}:${year}:${month}`;

const unwrapPayload = (response) => {
    if (response && typeof response === 'object' && response.success === true && response.data) {
        return response.data;
    }
    return response;
};

const toCountsMap = (rawCounts) => {
    const map = new Map();
    if (!Array.isArray(rawCounts)) {
        return map;
    }
    rawCounts.forEach((item) => {
        if (item && item.consultantId != null) {
            const numeric = Number(item.count);
            map.set(item.consultantId, Number.isFinite(numeric) ? numeric : 0);
        }
    });
    return map;
};

/**
 * 월별 상담사 COMPLETED 카운트 hook.
 *
 * @param {number|null} year  연도 (null/undefined 시 fetch 미발동)
 * @param {number|null} month 1-12 월 (null/undefined 시 fetch 미발동)
 * @returns {{ counts: Map<number|string, number>, isLoading: boolean, error: Error|null }}
 */
const useMonthlyConsultantCounts = (year, month) => {
    const { user } = useSession();
    const tenantId = user?.tenantId ?? null;

    const [counts, setCounts] = useState(() => new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const cacheRef = useRef(new Map());
    const lastTenantIdRef = useRef(tenantId);

    useEffect(() => {
        if (lastTenantIdRef.current !== tenantId) {
            cacheRef.current = new Map();
            lastTenantIdRef.current = tenantId;
        }
    }, [tenantId]);

    useEffect(() => {
        if (year == null || month == null) {
            return undefined;
        }

        const cacheKey = buildCacheKey(tenantId, year, month);
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
            setCounts(cached);
            setError(null);
            setIsLoading(false);
            return undefined;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const load = async() => {
            try {
                const response = await StandardizedApi.get(MONTHLY_CONSULTANT_COUNTS_ENDPOINT, {
                    year,
                    month
                });
                if (cancelled) return;
                const payload = unwrapPayload(response);
                const nextMap = toCountsMap(payload?.counts);
                cacheRef.current.set(cacheKey, nextMap);
                setCounts(nextMap);
            } catch (err) {
                console.warn('월별 상담사 COMPLETED 카운트 로드 실패:', err);
                if (!cancelled) {
                    setCounts(new Map());
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [tenantId, year, month]);

    return { counts, isLoading, error };
};

export default useMonthlyConsultantCounts;
export { MONTHLY_CONSULTANT_COUNTS_ENDPOINT };
