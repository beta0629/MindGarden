/**
 * 수동 발송 작업 진행을 주기적으로 조회한다. 조회마다 세션 활동을 알려 발송 중 관리자 세션이 끊기지 않게 하고,
 * 종료 상태가 되면 수신자별 기록을 한 번 더 받아 멈춘다. 401 은 StandardizedApi 공용 처리에 맡긴다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import { useEffect, useRef, useState } from 'react';
import {
  MANUAL_NOTIFICATION_JOB_POLL_INTERVAL_MS,
  fetchManualNotificationJob,
  isManualNotificationJobTerminal
} from '../api/admin/manualNotificationApi';
import { notifySessionActivity } from '../utils/sessionActivity';

/**
 * @param {(string|null)} jobId 작업 UUID(없으면 조회하지 않음)
 * @param {{ intervalMs?: number }} [options]
 * @returns {{ job: (object|null), done: boolean, error: (Error|null) }}
 */
const useManualNotificationJobPolling = (jobId, { intervalMs = MANUAL_NOTIFICATION_JOB_POLL_INTERVAL_MS } = {}) => {
  const [job, setJob] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setJob(null);
    setDone(false);
    setError(null);
    if (!jobId) {
      return undefined;
    }
    let cancelled = false;

    const tick = async() => {
      notifySessionActivity();
      try {
        const snapshot = await fetchManualNotificationJob(jobId);
        if (cancelled) {
          return;
        }
        if (snapshot && isManualNotificationJobTerminal(snapshot.status)) {
          const full = await fetchManualNotificationJob(jobId, { includeRecords: true });
          if (cancelled) {
            return;
          }
          setJob(full || snapshot);
          setDone(true);
          return;
        }
        if (snapshot) {
          setJob(snapshot);
        }
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err);
      }
      timerRef.current = window.setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [jobId, intervalMs]);

  return { job, done, error };
};

export default useManualNotificationJobPolling;
