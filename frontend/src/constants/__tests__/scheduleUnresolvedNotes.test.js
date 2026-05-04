import {
  CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD,
  parseClientScheduleNotesClientWideUnresolvedCount,
  parseClientScheduleNotesUnresolvedCount
} from '../schedule';

describe('parseClientScheduleNotesUnresolvedCount', () => {
  it('null·undefined·NaN·0·음수는 0', () => {
    expect(parseClientScheduleNotesUnresolvedCount(null)).toBe(0);
    expect(parseClientScheduleNotesUnresolvedCount(undefined)).toBe(0);
    expect(parseClientScheduleNotesUnresolvedCount('')).toBe(0);
    expect(parseClientScheduleNotesUnresolvedCount(NaN)).toBe(0);
    expect(parseClientScheduleNotesUnresolvedCount(0)).toBe(0);
    expect(parseClientScheduleNotesUnresolvedCount(-1)).toBe(0);
  });

  it('양의 유한값은 내림 정수', () => {
    expect(parseClientScheduleNotesUnresolvedCount(1)).toBe(1);
    expect(parseClientScheduleNotesUnresolvedCount(2.7)).toBe(2);
    expect(parseClientScheduleNotesUnresolvedCount('3')).toBe(3);
  });

  it('필드명 SSOT 상수 정의', () => {
    expect(CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD).toBe('clientScheduleNotesUnresolvedCount');
    expect(CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD).toBe(
      'clientScheduleNotesClientWideUnresolvedCount'
    );
  });
});

describe('parseClientScheduleNotesClientWideUnresolvedCount', () => {
  it('일정 직결 파서와 동일 규칙', () => {
    expect(parseClientScheduleNotesClientWideUnresolvedCount(2)).toBe(2);
    expect(parseClientScheduleNotesClientWideUnresolvedCount(0)).toBe(0);
  });
});
