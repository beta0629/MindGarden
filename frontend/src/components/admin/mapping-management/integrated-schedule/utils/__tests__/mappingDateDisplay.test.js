/**
 * mappingDateDisplay — 매핑 시작일 vs 최초 상담일
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import {
  MAPPING_DATE_KIND,
  MAPPING_DATE_LABEL,
  resolveFirstConsultationDate,
  resolveFirstConsultationDateFromSchedules,
  resolveMappingPrimaryDateDisplay,
  resolveMappingStartDate
} from '../mappingDateDisplay';

describe('mappingDateDisplay', () => {
  describe('resolveFirstConsultationDateFromSchedules', () => {
    it('returns MIN(date) across schedules', () => {
      expect(resolveFirstConsultationDateFromSchedules([
        { date: '2026-09-07', status: 'COMPLETED' },
        { date: '2026-08-31', status: 'COMPLETED' },
        { date: '2026-09-14', status: 'BOOKED' }
      ])).toBe('2026-08-31');
    });

    it('ignores items without parseable date', () => {
      expect(resolveFirstConsultationDateFromSchedules([
        { date: null },
        { date: '2026-09-01T14:00:00' }
      ])).toBe('2026-09-01');
    });

    it('returns null for empty list', () => {
      expect(resolveFirstConsultationDateFromSchedules([])).toBeNull();
      expect(resolveFirstConsultationDateFromSchedules(null)).toBeNull();
    });
  });

  describe('IL: mapping start later than client schedule MIN', () => {
    const ilMapping = {
      id: 9002,
      paymentTiming: 'INSTITUTION_LINK',
      startDate: '2026-09-01',
      createdAt: '2026-09-01T19:25:12',
      consultationSchedules: [
        { id: 2, date: '2026-09-07', status: 'COMPLETED' }
      ],
      clientConsultationSchedules: [
        { id: 1, date: '2026-08-31', status: 'COMPLETED' },
        { id: 2, date: '2026-09-07', status: 'COMPLETED' }
      ]
    };

    it('resolveFirstConsultationDate uses client lifetime MIN, not startDate', () => {
      expect(resolveFirstConsultationDate(ilMapping)).toBe('2026-08-31');
      expect(resolveMappingStartDate(ilMapping)).toBe('2026-09-01');
    });

    it('primary display is 최초 상담일 from schedule MIN', () => {
      const primary = resolveMappingPrimaryDateDisplay(ilMapping);
      expect(primary.kind).toBe(MAPPING_DATE_KIND.FIRST_CONSULTATION);
      expect(primary.label).toBe(MAPPING_DATE_LABEL.FIRST_CONSULTATION);
      expect(primary.date).toBe('2026-08-31');
      expect(primary.mappingStartDate).toBe('2026-09-01');
      expect(primary.firstConsultationDate).toBe('2026-08-31');
    });

    it('does not treat mapping.startDate as first consultation for IL', () => {
      expect(resolveFirstConsultationDate({
        ...ilMapping,
        clientConsultationSchedules: [],
        consultationSchedules: []
      })).toBeNull();
    });
  });

  it('falls back to mapping start when no schedules', () => {
    const primary = resolveMappingPrimaryDateDisplay({
      startDate: '2026-09-01',
      createdAt: '2026-09-01T10:00:00'
    });
    expect(primary.kind).toBe(MAPPING_DATE_KIND.MAPPING_START);
    expect(primary.label).toBe(MAPPING_DATE_LABEL.MAPPING_START);
    expect(primary.date).toBe('2026-09-01');
  });

  it('non-IL uses consultationSchedules MIN when present', () => {
    const primary = resolveMappingPrimaryDateDisplay({
      startDate: '2026-09-01',
      consultationSchedules: [
        { date: '2026-08-31', status: 'COMPLETED' }
      ]
    });
    expect(primary.date).toBe('2026-08-31');
    expect(primary.label).toBe(MAPPING_DATE_LABEL.FIRST_CONSULTATION);
  });
});
