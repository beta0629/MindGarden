/**
 * 일정 이동 본문·외부 드롭 기본 날짜의 벽시계.
 * 이 파일은 프로세스 TZ 그대로 판정한다. 서울·그 외 TZ 실행은 scheduleSeoulWallClock.test.js 가 띄운다.
 */
import { CONSULTATION_LOG_SESSION_START_TIME_ZONE } from '../../constants/consultationLogAutosaveConstants';
import { formatLocalDateYmd } from '../erpFinanceDisplay';
import {
  buildScheduleDatetimeUpdateBody,
  combineDateAndTimeHm
} from '../scheduleRescheduleUtils';
import { startOfLocalCalendarDay } from '../scheduleMoveGuard';

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => `t:${key}` }
}));

const SEOUL_ZONE = CONSULTATION_LOG_SESSION_START_TIME_ZONE;
const START = new Date('2026-10-06T02:30:00.000Z');
const END = new Date('2026-10-06T03:20:00.000Z');

const localHm = (date) => date.toTimeString().split(' ')[0].slice(0, 5);

describe('wall-clock cases', () => {
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  test('이동 본문은 운영 타임존 벽시계', () => {
    const body = buildScheduleDatetimeUpdateBody(START, END);
    expect(body).toEqual({
      date: '2026-10-06',
      startTime: '11:30',
      endTime: '12:20'
    });
    if (browserZone === SEOUL_ZONE) {
      expect(body.date).toBe(formatLocalDateYmd(START));
      expect(body.startTime).toBe(localHm(START));
      expect(body.endTime).toBe(localHm(END));
      expect(combineDateAndTimeHm('2026-10-01', '00:30').getTime())
        .toBe(new Date(2026, 9, 1, 0, 30, 0, 0).getTime());
    } else {
      expect(`${formatLocalDateYmd(START)}T${localHm(START)}`).not.toBe('2026-10-06T11:30');
      expect(combineDateAndTimeHm('2026-10-01', '00:30').getTime())
        .not.toBe(new Date(2026, 9, 1, 0, 30, 0, 0).getTime());
    }
  });

  test('외부 드롭 기본 날짜는 운영 타임존 달력일 00:00', () => {
    const day = startOfLocalCalendarDay(START);
    expect(day.toISOString()).toBe('2026-10-05T15:00:00.000Z');
    expect(buildScheduleDatetimeUpdateBody(day, day)).toEqual({
      date: '2026-10-06',
      startTime: '00:00',
      endTime: '00:00'
    });
    if (browserZone === SEOUL_ZONE) {
      expect(day.getFullYear()).toBe(2026);
      expect(day.getMonth()).toBe(9);
      expect(day.getDate()).toBe(6);
      expect(day.getHours()).toBe(0);
      expect(day.getMinutes()).toBe(0);
      expect(day.getSeconds()).toBe(0);
      expect(day.getMilliseconds()).toBe(0);
    } else {
      const localMidnightOnSameLabel = day.getHours() === 0
        && formatLocalDateYmd(day) === '2026-10-06';
      expect(localMidnightOnSameLabel).toBe(false);
    }
  });
});
