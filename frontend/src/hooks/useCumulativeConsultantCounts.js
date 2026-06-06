/**
 * useCumulativeConsultantCounts — 누적 상담사 COMPLETED 카운트 (전체 기간) 공통 hook.
 *
 * Phase 3-B (R6 2026-06-06) — AdminDashboardV2 「상담사 별 통합데이터」 카드의
 * «누적 상담 건수» 섹션 SSOT.
 *
 * SSOT API: GET /api/v1/schedules/cumulative-consultant-counts
 *   응답: { counts: [{ consultantId, consultantName, count }] }
 *   - 활성 상담사 모두 포함, 0건 상담사도 응답에 포함
 *   - 정렬: count DESC, consultantName ASC (백엔드)
 *
 * 캐시 정책 (월별과 다름 — year/month 키 없음):
 *   - 키: `${tenantId}` (컴포넌트 스코프 useRef Map — 단일 entry)
 *   - tenantId 변경 시 캐시 reset
 *   - cancelled 플래그로 unmount race 차단
 *   - 조용한 실패: 빈 Map + 토스트 미발동
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import { useEffect, useRef, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { useSession } from '../contexts/SessionContext';

const CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT = '/api/v1/schedules/cumulative-consultant-counts';

const buildCacheKey = (tenantId) => `${tenantId ?? 'unknown'}`;

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
 * 누적 상담사 COMPLETED 카운트 (전체 기간) hook.
 *
 * @returns {{ counts: Map<number|string, number>, isLoading: boolean, error: Error|null }}
 */
const useCumulativeConsultantCounts = () => {
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
        const cacheKey = buildCacheKey(tenantId);
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
                const response = await StandardizedApi.get(CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT);
                if (cancelled) return;
                const payload = unwrapPayload(response);
                const nextMap = toCountsMap(payload?.counts);
                cacheRef.current.set(cacheKey, nextMap);
                setCounts(nextMap);
            } catch (err) {
                console.warn('누적 상담사 COMPLETED 카운트 로드 실패:', err);
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
    }, [tenantId]);

    return { counts, isLoading, error };
};

export default useCumulativeConsultantCounts;
export { CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT };
