import {
  SCHEDULE_SESSION_NOT_STARTED_ERROR_CODE,
  SCHEDULE_START_PARSE_FAILED_WARNING,
  canCompleteScheduleNow,
  formatNowInSessionZone,
  hasScheduleSessionStarted,
  isScheduleSessionNotStartedError
} from '../scheduleSessionStart';

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

describe('canCompleteScheduleNow / isScheduleSessionNotStartedError', () => {
  test('관리자 완료 버튼은 시작 판정과 같은 규칙을 쓴다', () => {
    const schedule = { date: '2026-10-10', startTime: '14:00' };
    expect(canCompleteScheduleNow(schedule, BEFORE_START_UTC)).toBe(false);
    expect(canCompleteScheduleNow(schedule, AT_START_UTC)).toBe(true);
  });

  test('#1438 화면 형식 "오후 hh:mm" — 시작 전 비활성, 시작 후 활성', () => {
    const evening = { date: '2026-10-10', startTime: '오후 07:00' };
    expect(canCompleteScheduleNow(evening, new Date('2026-10-10T09:59:00Z'))).toBe(false);
    expect(canCompleteScheduleNow(evening, new Date('2026-10-10T10:00:00Z'))).toBe(true);
    const morning = { date: '2026-10-10', startTime: '오전 09:30' };
    expect(canCompleteScheduleNow(morning, new Date('2026-10-10T00:29:00Z'))).toBe(false);
    expect(canCompleteScheduleNow(morning, new Date('2026-10-10T00:30:00Z'))).toBe(true);
  });

  test('오프셋 ISO startTime 은 date 없이도 운영 타임존 날짜·시각으로 판정', () => {
    const iso = { startTime: '2026-10-10T05:00:00Z' };
    expect(canCompleteScheduleNow(iso, BEFORE_START_UTC)).toBe(false);
    expect(canCompleteScheduleNow(iso, AT_START_UTC)).toBe(true);
    const local = { date: '2026-10-10', startTime: '2026-10-10T14:00:00' };
    expect(canCompleteScheduleNow(local, BEFORE_START_UTC)).toBe(false);
  });

  test('「오후 01:30」·HH:mm·HH:mm:ss 모두 같은 시작 시각으로 읽는다', () => {
    const before = new Date('2026-10-10T04:29:00Z');
    const at = new Date('2026-10-10T04:30:00Z');
    ['오후 01:30', '13:30', '13:30:00', '01:30 PM'].forEach((startTime) => {
      expect(canCompleteScheduleNow({ date: '2026-10-10', startTime }, before)).toBe(false);
      expect(canCompleteScheduleNow({ date: '2026-10-10', startTime }, at)).toBe(true);
    });
  });

  test('apiDate·apiStartTime 을 표시용 date·startTime 보다 먼저 읽는다', () => {
    const schedule = {
      apiDate: '2026-10-10',
      apiStartTime: '14:00',
      date: '10월 10일',
      startTime: '오전 09:00'
    };
    expect(canCompleteScheduleNow(schedule, BEFORE_START_UTC)).toBe(false);
    expect(canCompleteScheduleNow(schedule, AT_START_UTC)).toBe(true);
    expect(canCompleteScheduleNow({ apiStartTime: '', startTime: '14:00', date: '2026-10-10' }, BEFORE_START_UTC))
      .toBe(false);
  });

  test('시각을 읽지 못하면 버튼은 켜 두고(서버 판정) 경고를 남긴다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(canCompleteScheduleNow({ date: '2026-10-10', startTime: '두시 반' }, BEFORE_START_UTC)).toBe(true);
      expect(warn).toHaveBeenCalledWith(
        SCHEDULE_START_PARSE_FAILED_WARNING,
        { date: '2026-10-10', startTime: '두시 반' }
      );
    } finally {
      warn.mockRestore();
    }
  });

  test('400 + SCHEDULE_SESSION_NOT_STARTED 만 시작 전 거부로 본다', () => {
    const rejected = { status: 400, response: { data: { errorCode: SCHEDULE_SESSION_NOT_STARTED_ERROR_CODE } } };
    expect(isScheduleSessionNotStartedError(rejected)).toBe(true);
    expect(isScheduleSessionNotStartedError({ status: 400, response: { data: { errorCode: 'ILLEGAL_STATE' } } }))
      .toBe(false);
    expect(isScheduleSessionNotStartedError({ status: 409, response: rejected.response })).toBe(false);
    expect(isScheduleSessionNotStartedError(null)).toBe(false);
  });
});
