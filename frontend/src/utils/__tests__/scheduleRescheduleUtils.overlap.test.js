/**
 * scheduleRescheduleUtils — hasConsultantScheduleTimeOverlap (CANCELLED 비점유)
 */
import { hasConsultantScheduleTimeOverlap } from '../scheduleRescheduleUtils';

const CONSULTANT_ID = 10;
const OTHER_CONSULTANT_ID = 20;

function buildEvent({
  id,
  consultantId = CONSULTANT_ID,
  status,
  statusCode,
  startHour = 10,
  endHour = 11
}) {
  const start = new Date(2026, 8, 10, startHour, 0, 0, 0);
  const end = new Date(2026, 8, 10, endHour, 0, 0, 0);
  return {
    id,
    start,
    end,
    extendedProps: {
      consultantId,
      ...(status !== undefined ? { status } : {}),
      ...(statusCode !== undefined ? { statusCode } : {})
    }
  };
}

describe('hasConsultantScheduleTimeOverlap occupying status', () => {
  const newStart = new Date(2026, 8, 10, 10, 0, 0, 0);
  const newEnd = new Date(2026, 8, 10, 11, 0, 0, 0);
  const movingId = 'moving-1';

  test('CANCELLED same consultant overlapping → false', () => {
    const events = [
      buildEvent({ id: 'other-1', status: 'CANCELLED' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(false);
  });

  test('Korean label 취소됨 via extendedProps.status → false', () => {
    const events = [
      buildEvent({ id: 'other-1', status: '취소됨' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(false);
  });

  test('BOOKED overlapping → true', () => {
    const events = [
      buildEvent({ id: 'other-1', status: 'BOOKED' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(true);
  });

  test('CONFIRMED overlapping → true', () => {
    const events = [
      buildEvent({ id: 'other-1', status: 'CONFIRMED' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(true);
  });

  test('COMPLETED overlapping → true (당일 사용 슬롯 점유)', () => {
    const events = [
      buildEvent({ id: 'other-1', status: 'COMPLETED' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(true);
  });

  test('Different consultant BOOKED overlapping → false', () => {
    const events = [
      buildEvent({
        id: 'other-1',
        consultantId: OTHER_CONSULTANT_ID,
        status: 'BOOKED'
      })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(false);
  });

  test('Exclude self by id even if BOOKED overlapping → false', () => {
    const events = [
      buildEvent({ id: movingId, status: 'BOOKED' })
    ];
    expect(
      hasConsultantScheduleTimeOverlap(events, movingId, CONSULTANT_ID, newStart, newEnd)
    ).toBe(false);
  });
});
