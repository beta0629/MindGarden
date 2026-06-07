/**
 * usePushMonitoringSnapshot — BW-1 「푸시 설정 모니터링」 60s 폴링 단일 진입 hook.
 *
 * <p>디자이너 핸드오프 §7.3 인터랙션·§11 작업 순서를 따른다. 컴포넌트 내부에서
 * `setInterval` 직접 사용을 금지하고 본 훅 한 곳에서만 폴링·visibility 일시중지를 관리한다.
 *
 * <p>핵심 동작:
 * <ul>
 *   <li>마운트 시 즉시 1회 fetch (initial loading), 그 후 60s 마다 백그라운드 fetch.</li>
 *   <li>{@code range} / {@code channel} 변경 시 타이머 리셋(즉시 1회 fetch).</li>
 *   <li>탭 visibility hidden 시 폴링 일시 정지, 복귀 시 즉시 1회 갱신.</li>
 *   <li>fetch 실패 시 오류 노출 + 15s 후 자동 재시도(다음 tick 도 정상 진행).</li>
 *   <li>unmount 시 타이머·visibility 리스너 정리(메모리 leak 차단).</li>
 * </ul>
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPushMonitoringSnapshot,
  PUSH_MONITORING_CHANNEL,
  PUSH_MONITORING_RANGE
} from '../api/admin/pushMonitoringApi';

const DEFAULT_INTERVAL_MS = 60000;
const RETRY_INTERVAL_MS = 15000;

const unwrapPayload = (response) => {
  if (response && typeof response === 'object' && response.success === true && response.data) {
    return response.data;
  }
  return response;
};

/**
 * 푸시 모니터링 스냅샷 폴링.
 *
 * @param {object} [options]
 * @param {string} [options.range='D7']
 * @param {string} [options.channel='ALL']
 * @param {number} [options.intervalMs=60000]
 * @param {boolean} [options.enabled=true]    페이지 unmount/마스킹 시 false 로 정지
 * @returns {{
 *   snapshot: object|null,
 *   isLoading: boolean,
 *   isRefreshing: boolean,
 *   error: Error|null,
 *   lastRefreshedAtIso: string|null,
 *   refresh: () => void,
 *   intervalMs: number
 * }}
 */
const usePushMonitoringSnapshot = ({
  range = PUSH_MONITORING_RANGE.D7,
  channel = PUSH_MONITORING_CHANNEL.ALL,
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true
} = {}) => {
  const [snapshot, setSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAtIso, setLastRefreshedAtIso] = useState(null);

  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const inFlightRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNextTick = useCallback((delay) => {
    clearTimer();
    if (!enabled || cancelledRef.current) {
      return;
    }
    timerRef.current = setTimeout(() => {
      // eslint-disable-next-line no-use-before-define
      runFetch(false);
    }, delay);
  }, [enabled, clearTimer]);

  const runFetch = useCallback(async (markInitial) => {
    if (cancelledRef.current || inFlightRef.current) {
      return;
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      // visibility 가 hidden 일 때는 폴링을 일시중지하고 visible 복귀 시 즉시 갱신한다.
      scheduleNextTick(intervalMs);
      return;
    }
    inFlightRef.current = true;
    if (markInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const response = await getPushMonitoringSnapshot({ range, channel });
      if (cancelledRef.current) {
        return;
      }
      const payload = unwrapPayload(response);
      setSnapshot(payload || null);
      setError(null);
      setLastRefreshedAtIso(new Date().toISOString());
      scheduleNextTick(intervalMs);
    } catch (err) {
      if (cancelledRef.current) {
        return;
      }
      const wrapped = err instanceof Error ? err : new Error(String(err));
      setError(wrapped);
      scheduleNextTick(RETRY_INTERVAL_MS);
    } finally {
      inFlightRef.current = false;
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [range, channel, intervalMs, scheduleNextTick]);

  const refresh = useCallback(() => {
    runFetch(false);
  }, [runFetch]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) {
      clearTimer();
      return undefined;
    }
    runFetch(true);
    return () => {
      cancelledRef.current = true;
      clearTimer();
    };
  }, [enabled, runFetch, clearTimer]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return undefined;
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runFetch(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, runFetch]);

  return {
    snapshot,
    isLoading,
    isRefreshing,
    error,
    lastRefreshedAtIso,
    refresh,
    intervalMs
  };
};

export default usePushMonitoringSnapshot;
export { DEFAULT_INTERVAL_MS as PUSH_MONITORING_DEFAULT_INTERVAL_MS };
export { RETRY_INTERVAL_MS as PUSH_MONITORING_RETRY_INTERVAL_MS };
