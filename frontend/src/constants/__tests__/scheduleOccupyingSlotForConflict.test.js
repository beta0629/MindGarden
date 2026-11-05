/**
 * 스케줄 슬롯 점유 상태 — BE ScheduleStatus#occupiesTimeForConflictCheck 정합
 */
import {
  isScheduleShownInExistingBookingsList,
  isScheduleStatusOccupyingTimeSlotForConflict,
  resolveScheduleStatusCodeForConflict,
  SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT
} from '../schedule';

describe('schedule occupying slot for conflict', () => {
  it('includes BOOKED, CONFIRMED, COMPLETED, IN_PROGRESS, TENTATIVE_PENDING_PAYMENT', () => {
    expect(SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has('BOOKED')).toBe(true);
    expect(SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has('CONFIRMED')).toBe(true);
    expect(SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has('COMPLETED')).toBe(true);
    expect(SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has('IN_PROGRESS')).toBe(true);
    expect(SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has('TENTATIVE_PENDING_PAYMENT')).toBe(
      true
    );
  });

  it('CANCELLED does not occupy; COMPLETED and active statuses do', () => {
    expect(isScheduleStatusOccupyingTimeSlotForConflict('CANCELLED')).toBe(false);
    expect(isScheduleStatusOccupyingTimeSlotForConflict('COMPLETED')).toBe(true);
    expect(isScheduleStatusOccupyingTimeSlotForConflict('AVAILABLE')).toBe(false);
    expect(isScheduleStatusOccupyingTimeSlotForConflict('VACATION')).toBe(false);
    expect(isScheduleStatusOccupyingTimeSlotForConflict('BOOKED')).toBe(true);
    expect(isScheduleStatusOccupyingTimeSlotForConflict('TENTATIVE_PENDING_PAYMENT')).toBe(true);
  });

  it('resolves Korean cancelled label to CANCELLED (non-occupying)', () => {
    const code = resolveScheduleStatusCodeForConflict({ status: '취소됨' });
    expect(code).toBe('CANCELLED');
    expect(isScheduleStatusOccupyingTimeSlotForConflict(code)).toBe(false);
  });

  it('COMPLETED는 기존 스케줄 목록에 보이고 CANCELLED는 숨긴다', () => {
    expect(isScheduleShownInExistingBookingsList({ status: 'COMPLETED' })).toBe(true);
    expect(isScheduleShownInExistingBookingsList({ status: 'CANCELLED' })).toBe(false);
  });
});
