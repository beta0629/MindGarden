import {
  buildOccupiedRangesFromSchedules,
  generateAdminScheduleTimeSlots,
  isScheduleStatusOccupyingSlot,
  isSlotStartAvailableForDuration,
  isTimeRangeOverlappingOccupied,
  validateAdminScheduleTimeSelection,
} from '../scheduleTimeSlotConflict';

describe('scheduleTimeSlotConflict', () => {
  const occupied = buildOccupiedRangesFromSchedules([
    { startTime: '10:00', endTime: '11:00', status: 'BOOKED' },
    { startTime: '14:00', endTime: '15:00', statusCode: 'CONFIRMED' },
    { startTime: '16:00', endTime: '17:00', status: 'CANCELLED' },
    { startTime: '17:00', endTime: '18:00', status: 'COMPLETED' },
    { startTime: '18:00', endTime: '19:00', status: 'VACATION' },
  ]);

  it('generates 30-minute slots from 09:00 up to before 21:00', () => {
    const slots = generateAdminScheduleTimeSlots();
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('20:30');
    expect(slots).toHaveLength((21 - 9) * 2);
  });

  it('marks occupying statuses only', () => {
    expect(isScheduleStatusOccupyingSlot('BOOKED')).toBe(true);
    expect(isScheduleStatusOccupyingSlot('CONFIRMED')).toBe(true);
    expect(isScheduleStatusOccupyingSlot('IN_PROGRESS')).toBe(true);
    expect(isScheduleStatusOccupyingSlot('CANCELLED')).toBe(false);
    expect(isScheduleStatusOccupyingSlot('COMPLETED')).toBe(false);
    expect(isScheduleStatusOccupyingSlot('VACATION')).toBe(false);
  });

  it('builds occupied ranges excluding non-occupying statuses', () => {
    expect(occupied).toEqual([
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '14:00', endTime: '15:00' },
    ]);
  });

  it('detects interval overlap', () => {
    expect(isTimeRangeOverlappingOccupied('10:30', '11:30', occupied)).toBe(true);
    expect(isTimeRangeOverlappingOccupied('11:00', '12:00', occupied)).toBe(false);
    expect(isTimeRangeOverlappingOccupied('13:30', '14:30', occupied)).toBe(true);
  });

  it('requires full duration to be free from slot start', () => {
    expect(isSlotStartAvailableForDuration('09:00', 60, occupied)).toBe(true);
    expect(isSlotStartAvailableForDuration('10:30', 60, occupied)).toBe(false);
    expect(isSlotStartAvailableForDuration('12:00', 90, occupied)).toBe(true);
    expect(isSlotStartAvailableForDuration('13:30', 90, occupied)).toBe(false);
  });

  it('validates selection against occupied ranges', () => {
    const futureYmd = '2099-12-31';
    expect(
      validateAdminScheduleTimeSelection(futureYmd, '09:00', '10:00', occupied),
    ).toEqual({ ok: true });
    expect(
      validateAdminScheduleTimeSelection(futureYmd, '10:00', '11:00', occupied),
    ).toEqual({ ok: false, reason: 'overlap' });
    expect(
      validateAdminScheduleTimeSelection('2000-01-01', '12:00', '13:00', occupied),
    ).toEqual({ ok: false, reason: 'past' });
  });
});
