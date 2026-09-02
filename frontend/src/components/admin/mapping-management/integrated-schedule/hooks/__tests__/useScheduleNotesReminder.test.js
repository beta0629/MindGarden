/**
 * useScheduleNotesReminder — 상담 시작 전 특이사항 알림 훅 테스트
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import StandardizedApi from '../../../../../../utils/standardizedApi';
import {
  useScheduleNotesReminder,
  isReminderEligibleEvent
} from '../useScheduleNotesReminder';
import {
  SCHEDULE_NOTES_REMINDER_LEAD_MS,
  SCHEDULE_NOTES_REMINDER_POLL_MS
} from '../../constants/scheduleNotesReminderConstants';
import { STATUS } from '../../../../../../constants/schedule';

jest.mock('../../../../../../utils/standardizedApi', () => ({
  get: jest.fn()
}));

const makeEvent = (id, startOffsetMs, status = STATUS.BOOKED) => {
  const start = new Date(Date.now() + startOffsetMs);
  return {
    id,
    start: start.toISOString(),
    end: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
    extendedProps: {
      status,
      clientId: 10,
      clientName: '테스트 내담자',
      consultantName: '상담사A',
      mappingId: 5
    }
  };
};

describe('useScheduleNotesReminder', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-02T10:00:00'));
    StandardizedApi.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('isReminderEligibleEvent rejects cancelled and non-numeric ids', () => {
    expect(isReminderEligibleEvent(makeEvent(1, 60_000))).toBe(true);
    expect(isReminderEligibleEvent(makeEvent(1, 60_000, STATUS.CANCELLED))).toBe(false);
    expect(isReminderEligibleEvent({
      id: 'vacation-1',
      start: new Date().toISOString(),
      extendedProps: { status: STATUS.BOOKED }
    })).toBe(false);
  });

  it('does not fetch when reminder switch is off', async() => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    renderHook(() => useScheduleNotesReminder({
      enabled: false,
      scheduleEvents: events
    }));

    await act(async() => {
      jest.advanceTimersByTime(SCHEDULE_NOTES_REMINDER_POLL_MS);
    });

    expect(StandardizedApi.get).not.toHaveBeenCalled();
  });

  it('opens modal inside 5-minute window when notes exist', async() => {
    StandardizedApi.get.mockResolvedValue({
      notes: [{ id: 1, title: '약속', body: '내용', noteType: 'OTHER' }]
    });

    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => useScheduleNotesReminder({
      enabled: true,
      scheduleEvents: events
    }));

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.isReminderOpen).toBe(true);
    });

    expect(result.current.reminderState?.notes).toHaveLength(1);
    expect(result.current.reminderState?.clientName).toBe('테스트 내담자');
  });

  it('skips modal when notes are empty and does not reopen', async() => {
    StandardizedApi.get.mockResolvedValue({ notes: [] });

    const events = [makeEvent(99, 4 * 60 * 1000)];
    const { result } = renderHook(() => useScheduleNotesReminder({
      enabled: true,
      scheduleEvents: events
    }));

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isReminderOpen).toBe(false);

    await act(async() => {
      jest.advanceTimersByTime(SCHEDULE_NOTES_REMINDER_POLL_MS);
    });

    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
  });

  it('does not trigger outside reminder window', async() => {
    const events = [makeEvent(55, SCHEDULE_NOTES_REMINDER_LEAD_MS + 2 * 60 * 1000)];
    renderHook(() => useScheduleNotesReminder({
      enabled: true,
      scheduleEvents: events
    }));

    await act(async() => {
      jest.advanceTimersByTime(SCHEDULE_NOTES_REMINDER_POLL_MS);
    });

    expect(StandardizedApi.get).not.toHaveBeenCalled();
  });
});
