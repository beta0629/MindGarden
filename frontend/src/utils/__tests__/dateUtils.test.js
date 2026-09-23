/**
 * dateUtils — buildMonthDateRangeYmd 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import { buildMonthDateRangeYmd, toDateStr } from '../dateUtils';

describe('dateUtils', () => {
  describe('buildMonthDateRangeYmd', () => {
    it('returns first and last day for a 31-day month', () => {
      expect(buildMonthDateRangeYmd(2026, 3)).toEqual({
        startDate: '2026-03-01',
        endDate: '2026-03-31'
      });
    });

    it('returns first and last day for February in a non-leap year', () => {
      expect(buildMonthDateRangeYmd(2026, 2)).toEqual({
        startDate: '2026-02-01',
        endDate: '2026-02-28'
      });
    });

    it('returns Feb 29 in a leap year', () => {
      expect(buildMonthDateRangeYmd(2024, 2)).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29'
      });
    });

    it('pads single-digit months', () => {
      expect(buildMonthDateRangeYmd(2026, 9)).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      });
    });

    it('accepts string year/month', () => {
      expect(buildMonthDateRangeYmd('2026', '1')).toEqual({
        startDate: '2026-01-01',
        endDate: '2026-01-31'
      });
    });

    it('returns empty strings for invalid month', () => {
      expect(buildMonthDateRangeYmd(2026, 0)).toEqual({ startDate: '', endDate: '' });
      expect(buildMonthDateRangeYmd(2026, 13)).toEqual({ startDate: '', endDate: '' });
      expect(buildMonthDateRangeYmd(2026, NaN)).toEqual({ startDate: '', endDate: '' });
    });
  });

  describe('toDateStr', () => {
    it('keeps YYYY-MM-DD strings', () => {
      expect(toDateStr('2026-09-23T12:00:00')).toBe('2026-09-23');
    });
  });
});
