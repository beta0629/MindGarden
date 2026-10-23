/**
 * timeSlotOccupancy — 슬롯 점유·시간 정규화·상담사 격리
 */
import { STATUS } from '../../constants/schedule';
import {
  checkTimeSlotConflict,
  extractScheduleListFromApiBody,
  mapCalendarEventToOccupancySchedule,
  mergeOccupancySchedules,
  overlaySelectedTimeOnOccupiedSlots,
  normalizeTimeStringForSlotCompare
} from '../timeSlotOccupancy';

const CONSULTANT_ID = 11;
const OTHER_CONSULTANT_ID = 22;
const SELECTED_DATE = new Date(2026, 8, 14);
const DURATION_50 = 50;
const SLOT_13_00 = '13:00';
const SLOT_14_00 = '14:00';
const SLOT_14_30 = '14:30';
const SLOT_15_00 = '15:00';
const SLOT_15_30 = '15:30';
const END_13_50 = '13:50';
const END_14_50 = '14:50';
const END_15_20 = '15:20';
const END_15_50 = '15:50';
const END_16_20 = '16:20';

function booked(overrides = {}) {
  return {
    id: overrides.id ?? 101,
    consultantId: CONSULTANT_ID,
    status: STATUS.BOOKED,
    startTime: '14:00',
    endTime: '14:50',
    ...overrides
  };
}

function conflictOf(slotTime, slotEndTime, extra) {
  return checkTimeSlotConflict({
    slotTime,
    slotEndTime,
    durationMinutes: DURATION_50,
    schedules: extra.schedules,
    occupyingHints: extra.occupyingHints,
    calendarEvents: extra.calendarEvents,
    consultantId: CONSULTANT_ID,
    selectedDate: SELECTED_DATE,
    excludeScheduleId: extra.excludeScheduleId
  });
}

describe('normalizeTimeStringForSlotCompare', () => {
  test('HH:mm:ss 문자열을 HH:mm으로 맞춘다', () => {
    expect(normalizeTimeStringForSlotCompare('14:00:00')).toBe('14:00');
    expect(normalizeTimeStringForSlotCompare('9:05:01')).toBe('09:05');
  });

  test('시간 배열·hour/minute 객체를 정규화한다', () => {
    expect(normalizeTimeStringForSlotCompare([14, 0])).toBe('14:00');
    expect(normalizeTimeStringForSlotCompare([15, 30, 0])).toBe('15:30');
    expect(normalizeTimeStringForSlotCompare({ hour: 14, minute: 0 })).toBe('14:00');
    expect(normalizeTimeStringForSlotCompare({ hour: 15, minute: 5, second: 0 })).toBe('15:05');
  });

  test('타임존 없는 ISO는 T 시각을 쓴다', () => {
    expect(normalizeTimeStringForSlotCompare('2026-09-14T14:00:00')).toBe('14:00');
  });
});

describe('checkTimeSlotConflict occupying overlap', () => {
  test('14:00-14:50 occupying → 14:00·14:30 충돌, 13:00은 10분 gap으로 비충돌', () => {
    const schedules = [booked({ startTime: '14:00', endTime: '14:50' })];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_14_30, END_15_20, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_13_00, END_13_50, { schedules }).conflict).toBe(false);
  });

  test('15:00-15:50 → 15:00 충돌', () => {
    const schedules = [booked({ id: 102, startTime: '15:00', endTime: '15:50' })];
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(false);
  });

  test('CONFIRMED 14:00:00-14:50:00 운영 JSON → 14:00·14:30 점유', () => {
    const schedules = [
      booked({
        status: STATUS.CONFIRMED,
        startTime: '14:00:00',
        endTime: '14:50:00'
      })
    ];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_14_30, END_15_20, { schedules }).conflict).toBe(true);
  });

  test('CONFIRMED 15:00-15:50 → 15:00·15:30 점유', () => {
    const schedules = [booked({ id: 426, status: STATUS.CONFIRMED, startTime: '15:00:00', endTime: '15:50:00' })];
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_15_30, END_16_20, { schedules }).conflict).toBe(true);
  });

  test('BOOKED도 COMPLETED와 같이 점유', () => {
    const schedules = [booked({ status: STATUS.BOOKED, startTime: '15:00', endTime: '15:50' })];
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_15_30, END_16_20, { schedules }).conflict).toBe(true);
  });

  test('Jackson enum 객체 status {name:CONFIRMED}도 점유', () => {
    const schedules = [
      booked({
        status: { name: 'CONFIRMED', displayName: '확정됨' },
        startTime: '15:00:00',
        endTime: '15:50:00'
      })
    ];
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_15_30, END_16_20, { schedules }).conflict).toBe(true);
  });

  test('end 00:00은 50분으로 추론해 15:00을 채운다', () => {
    const schedules = [booked({ id: 9, startTime: '15:00', endTime: '00:00:00' })];
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules }).conflict).toBe(true);
    expect(conflictOf(SLOT_15_30, END_16_20, { schedules }).conflict).toBe(true);
  });

  test('COMPLETED 14:00도 충돌', () => {
    const schedules = [booked({ status: STATUS.COMPLETED, startTime: '14:00', endTime: '14:50' })];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(true);
  });

  test('CANCELLED는 비충돌', () => {
    const schedules = [booked({ status: STATUS.CANCELLED, startTime: '14:00', endTime: '14:50' })];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(false);
  });

  test('다른 consultantId 힌트는 무시한다', () => {
    const occupyingHints = [
      booked({
        id: 303,
        consultantId: OTHER_CONSULTANT_ID,
        startTime: '14:00',
        endTime: '14:50'
      })
    ];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules: [], occupyingHints }).conflict).toBe(false);
  });

  test('배열 시작·end 누락은 duration 50분으로 추론해 14:00을 채운다', () => {
    const schedules = [
      {
        id: 201,
        consultantId: CONSULTANT_ID,
        status: STATUS.BOOKED,
        start_time: [14, 0],
        durationMinutes: DURATION_50
      }
    ];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules }).conflict).toBe(true);
  });

  test('15:30 슬롯은 16:00 점유 시작 힌트를 반환한다', () => {
    const schedules = [booked({ id: 160, startTime: '16:00', endTime: '16:50' })];
    const result = conflictOf(SLOT_15_30, END_16_20, { schedules });
    expect(result.conflict).toBe(true);
    expect(result.occupyingStartHm).toBe('16:00');
  });

  test('같은 상담사·당일 캘린더 이벤트가 API 누락을 보강한다', () => {
    const calendarEvents = [
      {
        id: 501,
        start: '2026-09-14T14:00:00',
        end: '2026-09-14T14:50:00',
        extendedProps: {
          consultantId: CONSULTANT_ID,
          status: STATUS.COMPLETED
        }
      }
    ];
    expect(conflictOf(SLOT_14_00, END_14_50, { schedules: [], calendarEvents }).conflict).toBe(true);
  });
});

describe('mapCalendarEventToOccupancySchedule consultant isolation', () => {
  test('다른 상담사 월간 칩은 null', () => {
    const mapped = mapCalendarEventToOccupancySchedule(
      {
        id: 9,
        start: '2026-09-14T14:00:00',
        end: '2026-09-14T14:50:00',
        extendedProps: { consultantId: OTHER_CONSULTANT_ID, status: STATUS.BOOKED }
      },
      CONSULTANT_ID,
      '2026-09-14'
    );
    expect(mapped).toBeNull();
  });
});

describe('mergeOccupancySchedules', () => {
  test('다른 날짜 캘린더 이벤트는 병합하지 않는다', () => {
    const merged = mergeOccupancySchedules({
      schedules: [],
      calendarEvents: [
        {
          id: 77,
          start: '2026-09-13T14:00:00',
          end: '2026-09-13T14:50:00',
          extendedProps: { consultantId: CONSULTANT_ID, status: STATUS.BOOKED }
        }
      ],
      consultantId: CONSULTANT_ID,
      selectedDate: SELECTED_DATE
    });
    expect(merged).toHaveLength(0);
  });

  test('API 행이 같은 start여도 비점유면 캘린더 CONFIRMED로 교체한다', () => {
    const merged = mergeOccupancySchedules({
      schedules: [
        {
          id: 1,
          consultantId: CONSULTANT_ID,
          status: { displayName: '알 수 없음' },
          startTime: '15:00:00',
          endTime: '15:50:00'
        }
      ],
      calendarEvents: [
        {
          id: 426,
          start: '2026-09-14T15:00:00',
          end: '2026-09-14T15:50:00',
          extendedProps: { consultantId: CONSULTANT_ID, status: STATUS.CONFIRMED }
        }
      ],
      consultantId: CONSULTANT_ID,
      selectedDate: SELECTED_DATE
    });
    expect(conflictOf(SLOT_15_00, END_15_50, { schedules: merged }).conflict).toBe(true);
  });
});

describe('extractScheduleListFromApiBody', () => {
  test('data 배열을 꺼낸다', () => {
    expect(extractScheduleListFromApiBody({ success: true, data: [{ id: 1 }] })).toHaveLength(1);
  });
});

describe('overlaySelectedTimeOnOccupiedSlots', () => {
  test('16:00 선택해도 15:00 점유는 가리지 않는다', () => {
    const slots = [
      {
        id: 'slot-15:00',
        time: SLOT_15_00,
        endTime: END_15_50,
        conflict: true,
        occupyingStartHint: SLOT_15_00,
        past: false,
        vacation: false,
        available: false
      },
      {
        id: 'slot-15:30',
        time: SLOT_15_30,
        endTime: END_16_20,
        conflict: true,
        occupyingStartHint: SLOT_15_00,
        past: false,
        vacation: false,
        available: false
      }
    ];
    const overlaid = overlaySelectedTimeOnOccupiedSlots(slots, {
      id: 'slot-16:00',
      time: '16:00',
      endTime: '16:50'
    });
    expect(overlaid[0].conflict).toBe(true);
    expect(overlaid[0].available).toBe(false);
    expect(overlaid[1].conflict).toBe(true);
  });
});
