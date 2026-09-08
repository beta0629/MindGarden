import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import {
  AVAILABILITY_MIN_LEAD_DAYS,
  getAvailabilityMinSelectableDate
} from '../consultantAvailabilityConstants';

describe('consultantAvailabilityConstants', () => {
  it('defaults leadDays to AVAILABILITY_MIN_LEAD_DAYS (2)', () => {
    expect(AVAILABILITY_MIN_LEAD_DAYS).toBe(2);
  });

  it('returns Seoul today + 2 as local YMD (fixed Seoul calendar day)', () => {
    // 2026-09-08 12:00 KST = 2026-09-08 03:00 UTC
    const now = new Date('2026-09-08T03:00:00.000Z');
    const minDate = getAvailabilityMinSelectableDate(AVAILABILITY_MIN_LEAD_DAYS, now);
    expect(formatLocalDateYmd(minDate)).toBe('2026-09-10');
    expect(minDate.getFullYear()).toBe(2026);
    expect(minDate.getMonth()).toBe(8);
    expect(minDate.getDate()).toBe(10);
  });

  it('uses Asia/Seoul today when UTC is still previous calendar day', () => {
    // Verification FAIL scenario: UTC 2026-09-07 evening = Seoul 2026-09-08 morning
    // Browser-local UTC would yield min 2026-09-09; Seoul must yield 2026-09-10
    const now = new Date('2026-09-07T20:00:00.000Z');
    const minDate = getAvailabilityMinSelectableDate(undefined, now);
    expect(formatLocalDateYmd(minDate)).toBe('2026-09-10');
  });

  it('honors custom leadDays', () => {
    const now = new Date('2026-09-08T03:00:00.000Z');
    const minDate = getAvailabilityMinSelectableDate(3, now);
    expect(formatLocalDateYmd(minDate)).toBe('2026-09-11');
  });
});
