/**
 * useMissingConsultationLogs — 월별 상담사 «상담일지 미작성» 일자 공통 hook.
 *
 * Phase 3-B (R6 2026-06-06) — IntegratedMatchingSchedule + AdminDashboardV2
 * 두 화면이 동일 SSOT 의 누락 일지 데이터를 동일 캐시 정책으로 사용하기 위해 추출.
 *
 * SSOT API: GET /api/v1/schedules/monthly-missing-consultation-logs?year=YYYY&month=M
 *   응답: { year, month, items: [{ consultantId, consultantName, missingDates: [...] }] }
 *   - 누락 0건 상담사는 응답 자체에서 제외 (백엔드 결정).
 *
 * 캐시 정책:
 *   - 키: `${tenantId}:${year}:${month}` (컴포넌트 스코프 useRef Map)
 *   - tenantId 변경 시 캐시 reset
 *   - cancelled 플래그로 unmount race 차단
 *   - 조용한 실패: items=null 유지 (섹션 자체 미노출)
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import { useEffect, useRef, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { useSession } from '../contexts/SessionContext';

const MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT = '/api/v1/schedules/monthly-missing-consultation-logs';

const buildCacheKey = (tenantId, year, month) =>
    `${tenantId ?? 'unknown'}:${year}:${month}`;

const unwrapPayload = (response) => {
    if (response && typeof response === 'object' && response.success === true && response.data) {
        return response.data;
    }
    return response;
};

/**
 * 응답 items 를 ScheduleLegend / MissingConsultationLogsList 형식으로 정규화.
 * 안전 폴백: items 가 배열이 아니면 [], missingDates 가 배열이 아니면 [].
 */
const normalize = (rawItems) => {
    if (!Array.isArray(rawItems)) {
        return [];
    }
    return rawItems
        .filter((item) => item && item.consultantId != null)
        .map((item) => ({
            consultantId: item.consultantId,
            consultantName: typeof item.consultantName === 'string' ? item.consultantName : '',
            missingDates: Array.isArray(item.missingDates)
                ? item.missingDates.map((d) => String(d ?? ''))
                : []
        }));
};

/**
 * 월별 상담사 상담일지 누락 일자 hook.
 *
 * @param {number|null} year  연도 (null/undefined 시 fetch 미발동, items=null 유지)
 * @param {number|null} month 1-12 월
 * @returns {{ items: null | Array<{ consultantId: number|string, consultantName: string, missingDates: string[] }>, isLoading: boolean, error: Error|null }}
 *   - items === null : 아직 첫 응답 미수신 (섹션 자체 미노출 sentinel)
 *   - items === []   : 모두 작성됨 placeholder
 *   - items.length>0 : 실제 누락 일지 리스트
 */
const useMissingConsultationLogs = (year, month) => {
    const { user } = useSession();
    const tenantId = user?.tenantId ?? null;

    const [items, setItems] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const cacheRef = useRef(new Map());
    const lastTenantIdRef = useRef(tenantId);

    useEffect(() => {
        if (lastTenantIdRef.current !== tenantId) {
            cacheRef.current = new Map();
            setItems(null);
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
            setItems(cached);
            setError(null);
            setIsLoading(false);
            return undefined;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const load = async() => {
            try {
                const response = await StandardizedApi.get(MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT, {
                    year,
                    month
                });
                if (cancelled) return;
                const payload = unwrapPayload(response);
                const normalized = normalize(payload?.items);
                cacheRef.current.set(cacheKey, normalized);
                setItems(normalized);
            } catch (err) {
                console.warn('월별 상담사 상담일지 누락 일자 로드 실패:', err);
                if (!cancelled) {
                    setItems(null);
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

    return { items, isLoading, error };
};

export default useMissingConsultationLogs;
export { MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT, normalize, unwrapPayload };
