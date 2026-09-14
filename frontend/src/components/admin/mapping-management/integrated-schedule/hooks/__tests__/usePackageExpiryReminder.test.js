/**
 * usePackageExpiryReminder — 상담 시작 전 회기권 만료 임박 훅 테스트
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import { renderHook, act } from '@testing-library/react';
import { usePackageExpiryReminder } from '../usePackageExpiryReminder';
import { PACKAGE_EXPIRY_REMINDER_POLL_MS } from '../../constants/packageExpiryReminderConstants';
import { STATUS } from '../../../../../../constants/schedule';
import {
  PAYMENT_TIMING_ADVANCE,
  PAYMENT_TIMING_INSTITUTION_LINK
} from '../../../constants/integratedScheduleSidebarFilterConstants';

const makeEvent = (id, startOffsetMs, mappingId = 5, status = STATUS.BOOKED) => {
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
      mappingId
    }
  };
};

const makeMapping = (overrides = {}) => ({
  id: 5,
  clientName: '테스트 내담자',
  consultantName: '상담사A',
  paymentTiming: PAYMENT_TIMING_ADVANCE,
  remainingSessions: 1,
  totalSessions: 10,
  ...overrides
});

describe('usePackageExpiryReminder', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-14T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not open when disabled', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: false,
      scheduleEvents: events,
      mappings: [makeMapping()]
    }));

    act(() => {
      jest.advanceTimersByTime(PACKAGE_EXPIRY_REMINDER_POLL_MS);
    });

    expect(result.current.isReminderOpen).toBe(false);
  });

  it('opens for prepaid package with 1 remaining session inside 5-minute window', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping({ remainingSessions: 1 })]
    }));

    expect(result.current.isReminderOpen).toBe(true);
    expect(result.current.reminderState?.clientName).toBe('테스트 내담자');
    expect(result.current.reminderState?.remainingSessions).toBe(1);
  });

  it('opens for remaining 2 sessions', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping({ remainingSessions: 2 })]
    }));

    expect(result.current.isReminderOpen).toBe(true);
  });

  it('does not open for institution-link mappings', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping({
        paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK,
        remainingSessions: 1
      })]
    }));

    expect(result.current.isReminderOpen).toBe(false);
  });

  it('does not open when remaining sessions are 3+', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping({ remainingSessions: 5 })]
    }));

    expect(result.current.isReminderOpen).toBe(false);
  });

  it('does not open when paused (notes modal occupying)', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping()],
      paused: true
    }));

    expect(result.current.isReminderOpen).toBe(false);
  });

  it('does not reopen after dismiss', () => {
    const events = [makeEvent(42, 4 * 60 * 1000)];
    const { result } = renderHook(() => usePackageExpiryReminder({
      enabled: true,
      scheduleEvents: events,
      mappings: [makeMapping()]
    }));

    expect(result.current.isReminderOpen).toBe(true);

    act(() => {
      result.current.dismissReminder();
    });

    expect(result.current.isReminderOpen).toBe(false);

    act(() => {
      jest.advanceTimersByTime(PACKAGE_EXPIRY_REMINDER_POLL_MS);
    });

    expect(result.current.isReminderOpen).toBe(false);
  });
});
