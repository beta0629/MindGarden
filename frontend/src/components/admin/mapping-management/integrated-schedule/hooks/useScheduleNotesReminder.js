/**
 * useScheduleNotesReminder — 통합 스케줄 상담 시작 5분 전 특이사항 알림
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import StandardizedApi from '../../../../../utils/standardizedApi';
import { CLIENT_SCHEDULE_NOTE_API } from '../../../../../constants/clientScheduleNoteConstants';
import { SCHEDULE_MAPPING_ID_FIELD, STATUS } from '../../../../../constants/schedule';
import {
  SCHEDULE_NOTES_REMINDER_LEAD_MS,
  SCHEDULE_NOTES_REMINDER_POLL_MS
} from '../constants/scheduleNotesReminderConstants';

const normalizeAnchorLong = (raw) => {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isSafeInteger(n) ? n : null;
  }
  return null;
};

const isReminderEligibleEvent = (event) => {
  if (!event?.start) return false;
  const scheduleId = normalizeAnchorLong(event.id);
  if (scheduleId == null) return false;

  const props = event.extendedProps || {};
  const status = props.status;
  if (status === STATUS.CANCELLED || status === STATUS.COMPLETED) {
    return false;
  }
  if (status === STATUS.VACATION) {
    return false;
  }

  const startMs = new Date(event.start).getTime();
  if (!Number.isFinite(startMs)) return false;

  return true;
};

const formatStartTimeLabel = (event) => {
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return '';
  const hours = String(start.getHours()).padStart(2, '0');
  const minutes = String(start.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} 상담`;
};

const fetchScheduleNotes = async(event) => {
  const props = event.extendedProps || {};
  const scheduleId = normalizeAnchorLong(event.id);
  const clientId = normalizeAnchorLong(props.clientId);
  const mappingId = normalizeAnchorLong(
    props[SCHEDULE_MAPPING_ID_FIELD] ?? props.mappingId
  );

  const params = {};
  if (scheduleId != null) params.scheduleId = scheduleId;
  if (clientId != null) params.clientId = clientId;
  if (mappingId != null) params.mappingId = mappingId;

  if (Object.keys(params).length === 0) {
    return [];
  }

  const res = await StandardizedApi.get(CLIENT_SCHEDULE_NOTE_API, params);
  const list = res?.notes ?? [];
  return Array.isArray(list) ? list : [];
};

/**
 * @param {object} params
 * @param {boolean} params.enabled 알림 스위치 ON
 * @param {Array<object>} params.scheduleEvents 캘린더 스케줄 이벤트(휴일·휴가 제외 권장)
 */
export function useScheduleNotesReminder({ enabled, scheduleEvents }) {
  const remindedScheduleIdsRef = useRef(new Set());
  const inFlightRef = useRef(false);
  const [reminderState, setReminderState] = useState(null);

  const dismissReminder = useCallback(() => {
    if (reminderState?.scheduleId != null) {
      remindedScheduleIdsRef.current.add(String(reminderState.scheduleId));
    }
    setReminderState(null);
  }, [reminderState?.scheduleId]);

  const checkReminders = useCallback(async() => {
    if (!enabled || inFlightRef.current || reminderState) {
      return;
    }

    const now = Date.now();
    const candidates = (scheduleEvents || []).filter((event) => {
      if (!isReminderEligibleEvent(event)) return false;
      const scheduleKey = String(normalizeAnchorLong(event.id));
      if (remindedScheduleIdsRef.current.has(scheduleKey)) return false;

      const startMs = new Date(event.start).getTime();
      const reminderStartMs = startMs - SCHEDULE_NOTES_REMINDER_LEAD_MS;
      return now >= reminderStartMs && now < startMs;
    });

    if (candidates.length === 0) {
      return;
    }

    const event = candidates.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )[0];

    const scheduleKey = String(normalizeAnchorLong(event.id));
    inFlightRef.current = true;
    try {
      const notes = await fetchScheduleNotes(event);
      if (!notes.length) {
        remindedScheduleIdsRef.current.add(scheduleKey);
        return;
      }

      const props = event.extendedProps || {};
      setReminderState({
        scheduleId: normalizeAnchorLong(event.id),
        clientName: props.clientName || '',
        consultantName: props.consultantName || '',
        startTimeLabel: formatStartTimeLabel(event),
        notes
      });
      remindedScheduleIdsRef.current.add(scheduleKey);
    } catch (error) {
      console.warn('특이사항 알림 로드 실패:', error);
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled, reminderState, scheduleEvents]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    checkReminders();
    const timerId = window.setInterval(checkReminders, SCHEDULE_NOTES_REMINDER_POLL_MS);
    return () => window.clearInterval(timerId);
  }, [enabled, checkReminders]);

  return {
    reminderState,
    dismissReminder,
    isReminderOpen: Boolean(reminderState)
  };
}

export {
  isReminderEligibleEvent,
  normalizeAnchorLong as normalizeScheduleAnchorLong
};
