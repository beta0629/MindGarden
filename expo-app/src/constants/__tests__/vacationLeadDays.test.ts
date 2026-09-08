/**
 * vacationLeadDays 단위 테스트 — Seoul today+2.
 */
import {
  VACATION_MIN_LEAD_DAYS,
  getVacationMinSelectableDateYmd,
  isVacationDateBeforeMinLead,
} from '../vacationLeadDays';

describe('vacationLeadDays', () => {
  it('lead days is 2', () => {
    expect(VACATION_MIN_LEAD_DAYS).toBe(2);
  });

  it('returns Seoul today + 2 as YMD', () => {
    const now = new Date('2026-09-08T03:00:00.000Z');
    expect(getVacationMinSelectableDateYmd(VACATION_MIN_LEAD_DAYS, now)).toBe('2026-09-10');
  });

  it('uses Seoul when UTC is previous calendar day', () => {
    const now = new Date('2026-09-07T20:00:00.000Z');
    expect(getVacationMinSelectableDateYmd(undefined, now)).toBe('2026-09-10');
  });

  it('rejects D-0/D-1 and accepts D-2+', () => {
    const now = new Date('2026-09-08T03:00:00.000Z');
    expect(isVacationDateBeforeMinLead('2026-09-08', 2, now)).toBe(true);
    expect(isVacationDateBeforeMinLead('2026-09-09', 2, now)).toBe(true);
    expect(isVacationDateBeforeMinLead('2026-09-10', 2, now)).toBe(false);
    expect(isVacationDateBeforeMinLead('2026-09-11', 2, now)).toBe(false);
  });
});
