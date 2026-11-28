/**
 * dateUtils — buildMonthDateRangeYmd 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import {
  buildAdminScheduleStatisticsQuery,
  buildCurrentMonthDateRangeYmd,
  buildCurrentWeekDateRangeYmd,
  buildMonthDateRangeYmd,
  buildSelectedPeriodDateRangeYmd,
  toDateStr
} from '../dateUtils';
import { DEFAULT_ZONE } from '../zonedDateTime';

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

  describe('KST current month / week / selected period', () => {
    const kstMonthEnd = new Date('2026-11-30T14:59:59Z'); // 23:59:59 KST 11/30
    const kstDecStart = new Date('2026-11-30T15:00:00Z'); // 00:00:00 KST 12/01
    const saturday = new Date('2026-11-28T05:00:00Z'); // 14:00 KST Saturday

    it('buildCurrentMonthDateRangeYmd uses Asia/Seoul, not UTC', () => {
      expect(DEFAULT_ZONE).toBe('Asia/Seoul');
      expect(buildCurrentMonthDateRangeYmd(kstMonthEnd)).toEqual({
        startDate: '2026-11-01',
        endDate: '2026-11-30'
      });
      expect(buildCurrentMonthDateRangeYmd(kstDecStart)).toEqual({
        startDate: '2026-12-01',
        endDate: '2026-12-31'
      });
    });

    it('buildCurrentWeekDateRangeYmd is Monday–Sunday in KST', () => {
      expect(buildCurrentWeekDateRangeYmd(saturday)).toEqual({
        startDate: '2026-11-23',
        endDate: '2026-11-29'
      });
    });

    it('buildSelectedPeriodDateRangeYmd covers year, quarter, month, week', () => {
      expect(buildSelectedPeriodDateRangeYmd({
        period: 'YEAR', year: 2026, month: 11, now: saturday
      })).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
      expect(buildSelectedPeriodDateRangeYmd({
        period: 'QUARTER', year: 2026, month: 11, now: saturday
      })).toEqual({ startDate: '2026-10-01', endDate: '2026-12-31' });
      expect(buildSelectedPeriodDateRangeYmd({
        period: 'MONTH', year: 2026, month: 11, now: saturday
      })).toEqual({ startDate: '2026-11-01', endDate: '2026-11-30' });
      expect(buildSelectedPeriodDateRangeYmd({
        period: 'WEEK', year: 2026, month: 11, now: saturday
      })).toEqual({ startDate: '2026-11-23', endDate: '2026-11-29' });
    });

    it('buildAdminScheduleStatisticsQuery injects userRole and range (default = this month)', () => {
      expect(buildAdminScheduleStatisticsQuery({
        userRole: 'ADMIN',
        now: kstMonthEnd
      })).toEqual({
        userRole: 'ADMIN',
        startDate: '2026-11-01',
        endDate: '2026-11-30'
      });
      expect(buildAdminScheduleStatisticsQuery({
        userRole: 'ADMIN',
        period: 'YEAR',
        year: 2026,
        month: 11,
        now: saturday
      })).toEqual({
        userRole: 'ADMIN',
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      });
    });
  });
});
