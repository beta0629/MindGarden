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

  describe('최가을형 IL: mapping 스코프 — 형제/SAME_DAY 일정 제외', () => {
    const choiIlMapping245 = {
      id: 245,
      paymentTiming: 'INSTITUTION_LINK',
      startDate: '2026-09-01',
      createdAt: '2026-09-01T19:25:12',
      consultationSchedules: [
        { id: 378, date: '2026-09-07', status: 'COMPLETED' }
      ],
      // client lifetime 에 SAME_DAY(242) 8/31 이 섞여 있어도 카드는 mapping만 사용
      clientConsultationSchedules: [
        { id: 373, date: '2026-08-31', status: 'COMPLETED' },
        { id: 378, date: '2026-09-07', status: 'COMPLETED' },
        { id: 436, date: '2026-09-14', status: 'CONFIRMED' }
      ]
    };

    it('resolveFirstConsultationDate uses mapping MIN (9/7), ignores other-card 8/31', () => {
      expect(resolveFirstConsultationDate(choiIlMapping245)).toBe('2026-09-07');
      expect(resolveMappingStartDate(choiIlMapping245)).toBe('2026-09-01');
    });

    it('primary display is 최초 상담일 9/7 (this mapping only)', () => {
      const primary = resolveMappingPrimaryDateDisplay(choiIlMapping245);
      expect(primary.kind).toBe(MAPPING_DATE_KIND.FIRST_CONSULTATION);
      expect(primary.label).toBe(MAPPING_DATE_LABEL.FIRST_CONSULTATION);
      expect(primary.date).toBe('2026-09-07');
      expect(primary.mappingStartDate).toBe('2026-09-01');
      expect(primary.firstConsultationDate).toBe('2026-09-07');
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
