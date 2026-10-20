/**
 * scheduleMoveGuard — 원래 시작·이동 후 시각 과거 판정·원본 상태 잠금·실패 문구
 *
 * 기준 현재 = 2026-10-06 14:00 KST (Asia/Seoul).
 */
import {
  SCHEDULE_CREATE_IN_PAST_ERROR_CODE,
  SCHEDULE_MOVE_FROM_PAST_ERROR_CODE,
  SCHEDULE_MOVE_TO_PAST_ERROR_CODE,
  appendScheduleMoveLockTooltip,
  getScheduleCreateInPastMessage,
  getScheduleMoveFromPastMessage,
  getScheduleMoveSourceLockedMessage,
  getScheduleMoveToPastMessage,
  isScheduleMoveSourceLocked,
  isScheduleMoveTargetInPast,
  isScheduleMoveTargetKeyInPast,
  isSchedulePastTimeError,
  resolveCalendarDropTargetStart,
  resolveScheduleMoveFailureMessage,
  resolveScheduleMoveTarget,
  startOfLocalCalendarDay
} from '../scheduleMoveGuard';
import {
  SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE,
  SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE
} from '../scheduleRescheduleUtils';
import koSchedule from '../../locales/ko/schedule.json';
import { CONSULTATION_LOG_SESSION_START_TIME_ZONE } from '../../constants/consultationLogAutosaveConstants';
import { dateFromWallClockInZone } from '../zonedDateTime';
import { buildScheduleDatetimeUpdateBody } from '../scheduleRescheduleUtils';
import { resetServerClock, setServerClockOffsetForTest } from '../serverClock';

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => `t:${key}` }
}));

const NOW = new Date('2026-10-06T05:00:00Z');

const localDate = (y, mo, d, h, mi) => new Date(y, mo - 1, d, h, mi, 0, 0);

const wallDate = (y, mo, d, h, mi) => dateFromWallClockInZone(
  { year: y, month: mo, day: d, hour: h, minute: mi },
  CONSULTATION_LOG_SESSION_START_TIME_ZONE
);

describe('scheduleMoveGuard', () => {
  describe('isScheduleMoveTargetKeyInPast (KST)', () => {
    test('현재 1분 전 → 과거, 현재·1분 후 → 허용', () => {
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:59', NOW)).toBe(true);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '14:00', NOW)).toBe(false);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '14:01', NOW)).toBe(false);
    });

    test('10/7 11:00 → 10/6 11:00 은 과거', () => {
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '11:00', NOW)).toBe(true);
      expect(isScheduleMoveTargetKeyInPast('2026-10-07', '11:00', NOW)).toBe(false);
    });

    test('자정 경계 — 23:59:30 KST 기준 당일 23:59 과거, 다음날 00:00 허용', () => {
      const nearMidnight = new Date('2026-10-06T14:59:30Z');
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '23:59', nearMidnight)).toBe(true);
      expect(isScheduleMoveTargetKeyInPast('2026-10-07', '00:00', nearMidnight)).toBe(false);
    });

    test('빈 값은 판정 불가 → false (서버가 최종 판정)', () => {
      expect(isScheduleMoveTargetKeyInPast('', '11:00', NOW)).toBe(false);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', null, NOW)).toBe(false);
    });
  });

  test('isScheduleMoveTargetInPast — PUT 본문과 같은 벽시계 값으로 판정, 잘못된 값은 false', () => {
    expect(isScheduleMoveTargetInPast(wallDate(2026, 10, 6, 11, 0), NOW)).toBe(true);
    expect(isScheduleMoveTargetInPast(wallDate(2026, 10, 8, 11, 0), NOW)).toBe(false);
    expect(isScheduleMoveTargetInPast(null, NOW)).toBe(false);
    expect(isScheduleMoveTargetInPast('not-a-date', NOW)).toBe(false);
  });

  test('resolveScheduleMoveTarget — 시작 변경은 새 시작, 종료만 변경(리사이즈)은 새 종료', () => {
    const original = localDate(2026, 10, 6, 13, 30);
    const moved = localDate(2026, 10, 8, 11, 0);
    const newEnd = localDate(2026, 10, 6, 14, 40);
    expect(resolveScheduleMoveTarget(original, moved, localDate(2026, 10, 8, 11, 50))).toBe(moved);
    expect(resolveScheduleMoveTarget(original, new Date(original.getTime()), newEnd)).toBe(newEnd);
  });

  test('resolveCalendarDropTargetStart — 월간 종일 칸에 시간 일정을 놓으면 원래 시각 유지', () => {
    const dropInfo = { start: localDate(2026, 10, 6, 0, 0), allDay: true };
    const dragged = { start: localDate(2026, 10, 9, 18, 30), allDay: false };
    const target = resolveCalendarDropTargetStart(dropInfo, dragged);
    expect(target.getDate()).toBe(6);
    expect(target.getHours()).toBe(18);
    expect(target.getMinutes()).toBe(30);
    expect(isScheduleMoveTargetInPast(target, NOW)).toBe(false);

    const timed = { start: localDate(2026, 10, 6, 11, 0), allDay: false };
    expect(resolveCalendarDropTargetStart(timed, dragged)).toBe(timed.start);
    expect(resolveCalendarDropTargetStart({ start: null }, dragged)).toBeNull();
  });

  test('원본 잠금은 완료·취소 또는 지난 시작 — 미래 BOOKED 는 잠그지 않음', () => {
    expect(isScheduleMoveSourceLocked({ status: 'COMPLETED' }, NOW)).toBe(true);
    expect(isScheduleMoveSourceLocked({ status: 'CANCELLED' }, NOW)).toBe(true);
    expect(isScheduleMoveSourceLocked({
      status: 'BOOKED',
      start: wallDate(2026, 10, 6, 11, 0)
    }, NOW)).toBe(true);
    expect(isScheduleMoveSourceLocked({
      status: 'BOOKED',
      start: wallDate(2026, 10, 8, 11, 0)
    }, NOW)).toBe(false);
    expect(getScheduleMoveSourceLockedMessage({ status: 'COMPLETED' }, NOW))
      .toBe(SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE);
    expect(getScheduleMoveSourceLockedMessage({ status: 'CANCELLED' }, NOW))
      .toBe(SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE);
    expect(getScheduleMoveSourceLockedMessage({
      status: 'BOOKED',
      start: wallDate(2026, 10, 6, 11, 0)
    }, NOW)).toBe('t:schedule:constants.scheduleMove.fromPast');
    expect(getScheduleMoveSourceLockedMessage({
      status: 'BOOKED',
      start: wallDate(2026, 10, 8, 11, 0)
    }, NOW)).toBeNull();
  });

  test('안내 문구는 i18n 키(ko 리소스 존재)', () => {
    expect(getScheduleMoveToPastMessage()).toBe('t:schedule:constants.scheduleMove.toPast');
    expect(getScheduleMoveFromPastMessage()).toBe('t:schedule:constants.scheduleMove.fromPast');
    expect(getScheduleCreateInPastMessage()).toBe('t:schedule:constants.scheduleMove.createInPast');
    expect(koSchedule.constants.scheduleMove.toPast).toEqual(expect.any(String));
    expect(koSchedule.constants.scheduleMove.fromPast).toEqual(expect.any(String));
    expect(koSchedule.constants.scheduleMove.createInPast).toEqual(expect.any(String));
  });

  test('startOfLocalCalendarDay — 운영 타임존 달력일 00:00', () => {
    const day = startOfLocalCalendarDay(wallDate(2026, 10, 6, 14, 30));
    expect(day.toISOString()).toBe('2026-10-05T15:00:00.000Z');
    expect(buildScheduleDatetimeUpdateBody(day, day)).toEqual({
      date: '2026-10-06',
      startTime: '00:00',
      endTime: '00:00'
    });
  });

  test('appendScheduleMoveLockTooltip — 사유가 있으면 title 뒤에 붙임', () => {
    expect(appendScheduleMoveLockTooltip('내담자 · 확정됨', '지난 일정')).toBe('내담자 · 확정됨 — 지난 일정');
    expect(appendScheduleMoveLockTooltip('내담자', null)).toBe('내담자');
  });

  describe('resolveScheduleMoveFailureMessage', () => {
    test('400 세 errorCode → 각각 i18n 안내', () => {
      const fromPast = { status: 400, response: { data: { errorCode: SCHEDULE_MOVE_FROM_PAST_ERROR_CODE } } };
      const toPast = { status: 400, response: { data: { errorCode: SCHEDULE_MOVE_TO_PAST_ERROR_CODE } } };
      const create = { status: 400, response: { data: { errorCode: SCHEDULE_CREATE_IN_PAST_ERROR_CODE } } };
      expect(isSchedulePastTimeError(fromPast)).toBe(true);
      expect(isSchedulePastTimeError(toPast)).toBe(true);
      expect(isSchedulePastTimeError(create)).toBe(true);
      expect(resolveScheduleMoveFailureMessage(fromPast, 'fallback'))
        .toBe('t:schedule:constants.scheduleMove.fromPast');
      expect(resolveScheduleMoveFailureMessage(toPast, 'fallback'))
        .toBe('t:schedule:constants.scheduleMove.toPast');
      expect(resolveScheduleMoveFailureMessage(create, 'fallback'))
        .toBe('t:schedule:constants.scheduleMove.createInPast');
    });

    test('그 외 400 은 서버 사유(완료 일정 등)', () => {
      const error = { status: 400, response: { data: { message: '완료된 스케줄은 일시를 변경할 수 없습니다.' } } };
      expect(resolveScheduleMoveFailureMessage(error, 'fallback'))
        .toBe('완료된 스케줄은 일시를 변경할 수 없습니다.');
    });

    test('500·사유 없음 → fallback', () => {
      expect(resolveScheduleMoveFailureMessage({ status: 500 }, 'fallback')).toBe('fallback');
      expect(resolveScheduleMoveFailureMessage(null, 'fallback')).toBe('fallback');
    });
  });

  describe('기준 시각 — 기기 시계와 서버 시계가 어긋날 때', () => {
    const originalOnLine = navigator.onLine;
    /** 2026-10-06 13:50:00 KST. 서버는 이보다 10분 앞(14:00 KST). */
    const deviceNow = Date.parse('2026-10-06T04:50:00.000Z');
    const skewMs = 10 * 60 * 1000;

    afterEach(() => {
      resetServerClock();
      jest.restoreAllMocks();
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => originalOnLine
      });
    });

    test('온라인이고 동기화됐으면 서버 시각으로 13:55 를 거부하고 14:00 은 허용한다', () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
      jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
      setServerClockOffsetForTest(skewMs, { synced: true, zone: CONSULTATION_LOG_SESSION_START_TIME_ZONE });
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:55')).toBe(true);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '14:00')).toBe(false);
      expect(isScheduleMoveTargetInPast(wallDate(2026, 10, 6, 13, 55))).toBe(true);
      expect(isScheduleMoveSourceLocked({
        status: 'BOOKED',
        start: wallDate(2026, 10, 6, 13, 55)
      })).toBe(true);
    });

    test('오프라인이면 같은 13:55 를 기기 시각으로 허용하고 13:49 는 거부한다', () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
      jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
      setServerClockOffsetForTest(skewMs, { synced: true, zone: CONSULTATION_LOG_SESSION_START_TIME_ZONE });
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:55')).toBe(false);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:49')).toBe(true);
      expect(isScheduleMoveTargetInPast(wallDate(2026, 10, 6, 13, 55))).toBe(false);
    });

    test('온라인이어도 동기화 전이면 기기 시각으로 판정한다', () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
      jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
      resetServerClock();
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:55')).toBe(false);
      expect(isScheduleMoveTargetKeyInPast('2026-10-06', '13:49')).toBe(true);
    });
  });
});
