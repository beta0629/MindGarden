import {
  formatDateKeyInZone,
  formatDateTimeKeyInZone,
  parseScheduleDateKey,
  parseScheduleTimeKey,
  parseScheduleTimeMinutes
} from '../zonedDateTime';

describe('parseScheduleTimeKey', () => {
  test.each([
    ['오후 07:00', '19:00'],
    ['오후 7:05', '19:05'],
    ['오전 09:30', '09:30'],
    ['오전 12:00', '00:00'],
    ['오후 12:00', '12:00'],
    ['07:00 PM', '19:00'],
    ['7:00am', '07:00'],
    ['19:00', '19:00'],
    ['9:00', '09:00'],
    ['19:00:00', '19:00'],
    ['19:00:59.123', '19:00'],
    ['2026-10-10T19:00:00', '19:00'],
    ['2026-10-10 19:00', '19:00'],
    ['2026-10-10T10:00:00Z', '19:00'],
    ['2026-10-10T19:00:00+09:00', '19:00'],
    [[19, 0], '19:00'],
    [[9, 5, 0], '09:05']
  ])('%p → %p', (input, expected) => {
    expect(parseScheduleTimeKey(input)).toBe(expected);
  });

  test.each([null, undefined, '', '시간 미정', '오후 13:00', '오전 00:30', '24:00', '19:60', 'abc', [19], 1900])(
    '읽을 수 없는 값 %p → null',
    (input) => {
      expect(parseScheduleTimeKey(input)).toBeNull();
    }
  );

  test('Date 는 운영 타임존 시각', () => {
    expect(parseScheduleTimeKey(new Date('2026-10-10T15:30:00Z'))).toBe('00:30');
    expect(parseScheduleTimeKey(new Date('invalid'))).toBeNull();
  });

  test('분 환산', () => {
    expect(parseScheduleTimeMinutes('오후 07:00')).toBe(19 * 60);
    expect(parseScheduleTimeMinutes('x')).toBeNull();
  });
});

describe('date keys (KST 경계)', () => {
  test('KST 이른 새벽은 UTC 전날이 아니라 KST 당일', () => {
    const earlyKst = new Date('2026-10-04T16:30:00Z');
    expect(formatDateKeyInZone(earlyKst)).toBe('2026-10-05');
    expect(earlyKst.toISOString().slice(0, 10)).toBe('2026-10-04');
    expect(formatDateTimeKeyInZone(earlyKst)).toBe('2026-10-05T01:30');
  });

  test('KST 자정 직전·직후', () => {
    expect(formatDateKeyInZone(new Date('2026-10-05T14:59:59Z'))).toBe('2026-10-05');
    expect(formatDateKeyInZone(new Date('2026-10-05T15:00:00Z'))).toBe('2026-10-06');
  });

  test('parseScheduleDateKey', () => {
    expect(parseScheduleDateKey('2026-10-05')).toBe('2026-10-05');
    expect(parseScheduleDateKey('2026-10-05T19:00:00')).toBe('2026-10-05');
    expect(parseScheduleDateKey('2026-10-04T16:30:00Z')).toBe('2026-10-05');
    expect(parseScheduleDateKey([2026, 1, 2])).toBe('2026-01-02');
    expect(parseScheduleDateKey('오후 07:00')).toBeNull();
    expect(parseScheduleDateKey(null)).toBeNull();
  });
});
