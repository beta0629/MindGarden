/**
 * mappingScheduleStatusDisplay 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-18
 */

import {
  formatConsultationDateMonthDay,
  MAPPING_SCHEDULE_STATUS_KIND,
  resolveMappingScheduleStatus
} from '../mappingScheduleStatusDisplay';

describe('mappingScheduleStatusDisplay', () => {
  describe('formatConsultationDateMonthDay', () => {
    it('formats ISO date to M/D', () => {
      expect(formatConsultationDateMonthDay('2026-07-20')).toBe('7/20');
      expect(formatConsultationDateMonthDay('2026-12-01')).toBe('12/1');
    });

    it('returns empty for nullish and original for invalid', () => {
      expect(formatConsultationDateMonthDay(null)).toBe('');
      expect(formatConsultationDateMonthDay(undefined)).toBe('');
      expect(formatConsultationDateMonthDay('not-a-date')).toBe('not-a-date');
    });
  });

  describe('resolveMappingScheduleStatus', () => {
    it('returns registered when nextConsultationDate is present', () => {
      expect(
        resolveMappingScheduleStatus({
          hasConsultationSchedule: true,
          nextConsultationDate: '2026-07-20'
        })
      ).toEqual({
        kind: MAPPING_SCHEDULE_STATUS_KIND.REGISTERED,
        label: '일정 등록 · 7/20'
      });
    });

    it('returns history when only past occupying schedules exist', () => {
      expect(
        resolveMappingScheduleStatus({
          hasConsultationSchedule: true,
          nextConsultationDate: null
        })
      ).toEqual({
        kind: MAPPING_SCHEDULE_STATUS_KIND.HISTORY,
        label: '일정 이력 있음'
      });
    });

    it('returns none when no occupying schedules', () => {
      expect(
        resolveMappingScheduleStatus({
          hasConsultationSchedule: false,
          nextConsultationDate: null
        })
      ).toEqual({
        kind: MAPPING_SCHEDULE_STATUS_KIND.NONE,
        label: '일정 미등록'
      });
    });

    it('defaults to none for empty mapping', () => {
      expect(resolveMappingScheduleStatus(undefined)).toEqual({
        kind: MAPPING_SCHEDULE_STATUS_KIND.NONE,
        label: '일정 미등록'
      });
    });
  });
});
