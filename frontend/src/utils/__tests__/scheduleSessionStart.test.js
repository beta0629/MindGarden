import { formatNowInSessionZone, hasScheduleSessionStarted } from '../scheduleSessionStart';

/** 판정 시간대(서버와 동일 기본값) 벽시계 2026-10-10 13:59 에 해당하는 UTC 시각 */
const BEFORE_START_UTC = new Date('2026-10-10T04:59:00Z');
const AT_START_UTC = new Date('2026-10-10T05:00:00Z');

describe('hasScheduleSessionStarted', () => {
  test('판정 시간대 벽시계로 포맷한다', () => {
    expect(formatNowInSessionZone(AT_START_UTC)).toBe('2026-10-10T14:00');
  });

  test('시작 1분 전 false, 정각 true (문자열·배열 응답 모두)', () => {
    const schedule = { date: '2026-10-10', startTime: '14:00:00' };
    expect(hasScheduleSessionStarted(schedule, BEFORE_START_UTC)).toBe(false);
    expect(hasScheduleSessionStarted(schedule, AT_START_UTC)).toBe(true);
    expect(hasScheduleSessionStarted({ date: [2026, 10, 10], startTime: [14, 0] }, BEFORE_START_UTC)).toBe(false);
  });

  test('자정 경계 — 00:00 시작 일정은 전날 23:59 에 시작 전', () => {
    const midnight = { date: '2026-10-11', startTime: '00:00' };
    expect(hasScheduleSessionStarted(midnight, new Date('2026-10-10T14:59:00Z'))).toBe(false);
    expect(hasScheduleSessionStarted(midnight, new Date('2026-10-10T15:00:00Z'))).toBe(true);
  });

  test('날짜를 읽을 수 없으면 true — 판정은 서버에 맡긴다', () => {
    expect(hasScheduleSessionStarted(null, BEFORE_START_UTC)).toBe(true);
    expect(hasScheduleSessionStarted({ startTime: '14:00' }, BEFORE_START_UTC)).toBe(true);
  });
});
