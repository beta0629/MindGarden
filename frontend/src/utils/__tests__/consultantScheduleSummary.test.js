/**
 * consultantScheduleSummary — 오늘·이번 주(월~일) 건수 · 취소/휴무 제외 · 로컬 자정 경계
 */
import {
  buildConsultantScheduleSummary,
  doesRangeCoverCurrentWeek,
  startOfLocalWeekMonday
} from '../consultantScheduleSummary';

const at = (y, m, d, h = 10, min = 0) => new Date(y, m - 1, d, h, min);
const ev = (start, status = 'BOOKED') => ({ start, extendedProps: { status } });

describe('consultantScheduleSummary', () => {
  it('startOfLocalWeekMonday: 일요일은 직전 월요일', () => {
    expect(startOfLocalWeekMonday(at(2026, 10, 11))).toEqual(new Date(2026, 9, 5));
    expect(startOfLocalWeekMonday(at(2026, 10, 7))).toEqual(new Date(2026, 9, 5));
    expect(startOfLocalWeekMonday(at(2026, 10, 5, 0, 0))).toEqual(new Date(2026, 9, 5));
  });

  it('오늘·이번 주 건수, 취소·휴무 제외', () => {
    const now = at(2026, 10, 7, 9);
    const events = [
      ev(at(2026, 10, 7, 10)),
      ev(at(2026, 10, 7, 14), 'COMPLETED'),
      ev(at(2026, 10, 7, 15), 'CANCELLED'),
      ev(at(2026, 10, 7, 16), 'VACATION'),
      ev(at(2026, 10, 5, 10), 'CONFIRMED'),
      ev(at(2026, 10, 11, 23, 59)),
      ev(at(2026, 10, 12, 0, 0)),
      ev(at(2026, 10, 4, 23, 59))
    ];
    expect(buildConsultantScheduleSummary(events, now)).toEqual({ todayCount: 2, weekCount: 4 });
  });

  it('자정 경계: 23:59 는 당일, 다음날 00:00 은 제외', () => {
    const now = at(2026, 10, 7, 23, 30);
    const events = [ev(at(2026, 10, 7, 23, 59)), ev(at(2026, 10, 8, 0, 0))];
    expect(buildConsultantScheduleSummary(events, now).todayCount).toBe(1);
  });

  it('빈 입력·잘못된 start 는 0', () => {
    expect(buildConsultantScheduleSummary(null, new Date())).toEqual({ todayCount: 0, weekCount: 0 });
    expect(buildConsultantScheduleSummary([ev('not-a-date'), { start: null }], new Date()))
      .toEqual({ todayCount: 0, weekCount: 0 });
  });

  it('doesRangeCoverCurrentWeek: 이번 주(월~일) 전체를 덮는 범위만 true, 전량(null)은 true', () => {
    const now = at(2026, 10, 7, 9);
    expect(doesRangeCoverCurrentWeek(null, now)).toBe(true);
    expect(doesRangeCoverCurrentWeek({ startDate: '2026-09-27', endDate: '2026-11-07' }, now)).toBe(true);
    expect(doesRangeCoverCurrentWeek({ startDate: '2026-10-05', endDate: '2026-10-11' }, now)).toBe(true);
    expect(doesRangeCoverCurrentWeek({ startDate: '2026-11-01', endDate: '2026-12-12' }, now)).toBe(false);
    expect(doesRangeCoverCurrentWeek({ startDate: '2026-10-06', endDate: '2026-10-31' }, now)).toBe(false);
    expect(doesRangeCoverCurrentWeek({ startDate: '2026-09-27', endDate: '2026-10-10' }, now)).toBe(false);
    expect(doesRangeCoverCurrentWeek({ startDate: '', endDate: '2026-10-31' }, now)).toBe(false);
  });
});
