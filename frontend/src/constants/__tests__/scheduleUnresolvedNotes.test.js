import {
  CALENDAR_SESSION_LABEL_VARIANT,
  CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD,
  SCHEDULE_SESSION_SEQUENCE_FIELD,
  formatCalendarSessionLabel,
  parseClientScheduleNotesClientWideUnresolvedCount,
  parseClientScheduleNotesUnresolvedCount,
  resolveCalendarSessionLabel,
  shouldShowCalendarSessionLabel
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

describe('formatCalendarSessionLabel', () => {
  it('다회기만 잔여 표시 (남은/총)', () => {
    expect(formatCalendarSessionLabel(2, 10)).toBe('남2/10');
    expect(shouldShowCalendarSessionLabel(10, 2)).toBe(true);
  });

  it('단회기·총 1회기·비정상값은 빈 문자열', () => {
    expect(formatCalendarSessionLabel(1, 1)).toBe('');
    expect(formatCalendarSessionLabel(0, 1)).toBe('');
    expect(formatCalendarSessionLabel(2, null)).toBe('');
    expect(shouldShowCalendarSessionLabel(1, 1)).toBe(false);
  });
});

describe('resolveCalendarSessionLabel', () => {
  it('필드명 SSOT 상수 정의', () => {
    expect(SCHEDULE_SESSION_SEQUENCE_FIELD).toBe('sessionSequence');
  });

  it('과거·sessionSequence 있으면 예약 시점 회차 표시', () => {
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 4,
        remainingSessions: 7,
        totalSessions: 10,
        status: 'BOOKED',
        isPast: true
      })
    ).toEqual({
      label: '4/10회',
      variant: CALENDAR_SESSION_LABEL_VARIANT.BOOKING_SEQUENCE,
      ariaLabel: '4회차(4/10)'
    });
  });

  it('완료 상태는 sessionSequence 우선', () => {
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 4,
        remainingSessions: 7,
        totalSessions: 10,
        status: 'COMPLETED',
        isPast: false
      })
    ).toEqual({
      label: '4/10회',
      variant: CALENDAR_SESSION_LABEL_VARIANT.BOOKING_SEQUENCE,
      ariaLabel: '4회차(4/10)'
    });
  });

  it('미래 예정은 잔여 회기 표시', () => {
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 4,
        remainingSessions: 5,
        totalSessions: 10,
        status: 'BOOKED',
        isPast: false
      })
    ).toEqual({
      label: '남5/10',
      variant: CALENDAR_SESSION_LABEL_VARIANT.REMAINING,
      ariaLabel: '남은 회기 5/10'
    });
  });

  it('취소·휴가·단회기는 빈 결과', () => {
    const empty = { label: '', variant: null, ariaLabel: '' };
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 2,
        remainingSessions: 1,
        totalSessions: 10,
        status: 'CANCELLED',
        isPast: true
      })
    ).toEqual(empty);
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 2,
        remainingSessions: 1,
        totalSessions: 10,
        status: 'VACATION',
        isPast: false
      })
    ).toEqual(empty);
    expect(
      resolveCalendarSessionLabel({
        sessionSequence: 1,
        remainingSessions: 0,
        totalSessions: 1,
        status: 'BOOKED',
        isPast: false
      })
    ).toEqual(empty);
  });
});
