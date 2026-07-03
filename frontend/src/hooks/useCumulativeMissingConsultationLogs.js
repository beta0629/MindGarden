/**
 * useCumulativeMissingConsultationLogs — 누적 상담사 «상담일지 미작성» 일자 공통 hook.
 *
 * 어드민 대시보드 section.mg-v2-ad-b0kla__missing-logs-section SSOT.
 * useMissingConsultationLogs(year, month) 가 특정 월로 제한되는 것과 달리, «지난 일정»
 * (date < today) 전체의 누락 상담일지를 반환한다. 대시보드 섹션은 달이 바뀌어도 이전 달
 * 누락 건이 사라지면 안 되므로 월 경계에 의존하지 않는다. (7/3 접속 시 6/30 누락 건이
 * 7월 범위 밖으로 빠져 미집계되던 버그 보정.)
 *
 * SSOT API: GET /api/v1/schedules/cumulative-missing-consultation-logs
 *   응답: { items: [{ consultantId, consultantName, missingDates: [...] }] }
 *   - 누락 0건 상담사는 응답 자체에서 제외 (백엔드 결정).
 *
 * 캐시 정책 (월별과 다름 — year/month 키 없음):
 *   - 키: `${tenantId}` (컴포넌트 스코프 useRef Map — 단일 entry)
 *   - tenantId 변경 시 캐시 reset
 *   - cancelled 플래그로 unmount race 차단
 *   - 조용한 실패: items=null 유지 (섹션 자체 미노출)
 *
 * @author Core Solution
 * @since 2026-07-03
 */

import { useEffect, useRef, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { useSession } from '../contexts/SessionContext';
import { normalize, unwrapPayload } from './useMissingConsultationLogs';

const CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT = '/api/v1/schedules/cumulative-missing-consultation-logs';

const buildCacheKey = (tenantId) => `${tenantId ?? 'unknown'}`;

/**
 * 누적 상담사 상담일지 누락 일자 hook.
 *
 * @returns {{ items: null | Array<{ consultantId: number|string, consultantName: string, missingDates: string[] }>, isLoading: boolean, error: Error|null }}
 *   - items === null : 아직 첫 응답 미수신 (섹션 자체 미노출 sentinel)
 *   - items === []   : 모두 작성됨 placeholder
 *   - items.length>0 : 실제 누락 일지 리스트
 */
const useCumulativeMissingConsultationLogs = () => {
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
        const cacheKey = buildCacheKey(tenantId);
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
                const response = await StandardizedApi.get(CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT);
                if (cancelled) return;
                const payload = unwrapPayload(response);
                const normalized = normalize(payload?.items);
                cacheRef.current.set(cacheKey, normalized);
                setItems(normalized);
            } catch (err) {
                console.warn('누적 상담사 상담일지 누락 일자 로드 실패:', err);
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
    }, [tenantId]);

    return { items, isLoading, error };
};

export default useCumulativeMissingConsultationLogs;
export { CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT };
