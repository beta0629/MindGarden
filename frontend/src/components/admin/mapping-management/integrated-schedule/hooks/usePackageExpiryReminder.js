/**
 * usePackageExpiryReminder — 상담 시작 전 회기권 패키지 만료 임박 (관리자 통합 스케줄)
 *
 * 특이사항 알림과 같은 5분 창을 쓰되, 모달 제목·문구는 분리한다.
 * 타기관 연계·바우처는 대상이 아니다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PACKAGE_EXPIRY_REMINDER_LEAD_MS,
  PACKAGE_EXPIRY_REMINDER_POLL_MS
} from '../constants/packageExpiryReminderConstants';
import {
  formatPackageExpiryStartTimeLabel,
  isSessionPackageExpiryImminent,
  resolveEventMappingId
} from '../utils/packageExpiryReminderUtils';
import {
  isReminderEligibleEvent,
  normalizeScheduleAnchorLong
} from './useScheduleNotesReminder';

const buildMappingById = (mappings) => {
  const map = new Map();
  (mappings || []).forEach((mapping) => {
    if (mapping?.id == null) {
      return;
    }
    map.set(String(mapping.id), mapping);
  });
  return map;
};

const resolveMappingForEvent = (event, mappingById) => {
  const mappingId = resolveEventMappingId(event);
  if (mappingId == null) {
    return null;
  }
  return mappingById.get(String(mappingId))
    ?? mappingById.get(String(normalizeScheduleAnchorLong(mappingId)))
    ?? null;
};

/**
 * @param {object} params
 * @param {boolean} [params.enabled=true] 관리자 화면에서 기본 ON
 * @param {Array<object>} params.scheduleEvents 캘린더 스케줄 이벤트
 * @param {Array<object>} params.mappings 배정 목록 (paymentTiming·remainingSessions SSOT)
 * @param {boolean} [params.paused=false] 특이사항 모달이 열려 있으면 대기
 */
export function usePackageExpiryReminder({
  enabled = true,
  scheduleEvents,
  mappings,
  paused = false
}) {
  const remindedScheduleIdsRef = useRef(new Set());
  const [reminderState, setReminderState] = useState(null);

  const mappingById = useMemo(() => buildMappingById(mappings), [mappings]);

  const dismissReminder = useCallback(() => {
    if (reminderState?.scheduleId != null) {
      remindedScheduleIdsRef.current.add(String(reminderState.scheduleId));
    }
    setReminderState(null);
  }, [reminderState?.scheduleId]);

  const checkReminders = useCallback(() => {
    if (!enabled || paused || reminderState) {
      return;
    }

    const now = Date.now();
    const candidates = (scheduleEvents || []).filter((event) => {
      if (!isReminderEligibleEvent(event)) {
        return false;
      }
      const scheduleKey = String(normalizeScheduleAnchorLong(event.id));
      if (remindedScheduleIdsRef.current.has(scheduleKey)) {
        return false;
      }
      const startMs = new Date(event.start).getTime();
      const reminderStartMs = startMs - PACKAGE_EXPIRY_REMINDER_LEAD_MS;
      return now >= reminderStartMs && now < startMs;
    });

    if (candidates.length === 0) {
      return;
    }

    const sorted = candidates.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    for (let i = 0; i < sorted.length; i += 1) {
      const event = sorted[i];
      const scheduleKey = String(normalizeScheduleAnchorLong(event.id));
      const mapping = resolveMappingForEvent(event, mappingById);
      if (!mapping) {
        continue;
      }
      if (!isSessionPackageExpiryImminent(mapping)) {
        remindedScheduleIdsRef.current.add(scheduleKey);
        continue;
      }

      const props = event.extendedProps || {};
      setReminderState({
        scheduleId: normalizeScheduleAnchorLong(event.id),
        mappingId: mapping.id,
        clientName: props.clientName || mapping.clientName || '',
        consultantName: props.consultantName || mapping.consultantName || '',
        startTimeLabel: formatPackageExpiryStartTimeLabel(event),
        remainingSessions: mapping.remainingSessions,
        totalSessions: mapping.totalSessions
      });
      remindedScheduleIdsRef.current.add(scheduleKey);
      return;
    }
  }, [enabled, mappingById, paused, reminderState, scheduleEvents]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    checkReminders();
    const timerId = window.setInterval(checkReminders, PACKAGE_EXPIRY_REMINDER_POLL_MS);
    return () => window.clearInterval(timerId);
  }, [enabled, checkReminders]);

  return {
    reminderState,
    dismissReminder,
    isReminderOpen: Boolean(reminderState)
  };
}
