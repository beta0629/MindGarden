/**
 * mappingScheduleDesync 단위 테스트 — SSOT kind 표 정합
 *
 * @author CoreSolution
 * @since 2026-07-18
 */

import {
  MAPPING_DESYNC_CTA_TYPE,
  MAPPING_DESYNC_KIND,
  hasFutureOccupyingSchedule,
  resolveMappingScheduleDesync
} from '../mappingScheduleDesync';
import { PAYMENT_TIMING_SAME_DAY_CARD } from '../../../constants/integratedScheduleSidebarFilterConstants';

describe('mappingScheduleDesync', () => {
  describe('hasFutureOccupyingSchedule', () => {
    it('uses nextConsultationDate only', () => {
      expect(hasFutureOccupyingSchedule({ nextConsultationDate: '2026-07-20' })).toBe(true);
      expect(hasFutureOccupyingSchedule({ nextConsultationDate: null })).toBe(false);
      expect(
        hasFutureOccupyingSchedule({
          hasUpcomingConsultationSchedule: true,
          nextConsultationDate: null
        })
      ).toBe(false);
    });
  });

  describe('resolveMappingScheduleDesync', () => {
    it('SESSIONS_EXHAUSTED + nextDate → CTA 없음 (오탐 방지)', () => {
      const result = resolveMappingScheduleDesync({
        status: 'SESSIONS_EXHAUSTED',
        remainingSessions: 0,
        nextConsultationDate: '2026-07-20',
        hasConsultationSchedule: true
      });
      expect(result.kind).toBe(MAPPING_DESYNC_KIND.SESSIONS_IN_PROGRESS);
      expect(result.isDesync).toBe(false);
      expect(result.ctaType).toBeNull();
      expect(result.ctaLabel).toBe('');
      expect(result.badgeLabel).toBe('');
      expect(result.tooltip).toBe('예정 상담 진행 중');
    });

    it('TERMINATED + nextDate → desync-cleanup', () => {
      const result = resolveMappingScheduleDesync({
        status: 'TERMINATED',
        nextConsultationDate: '2026-07-22'
      });
      expect(result.kind).toBe(MAPPING_DESYNC_KIND.CLEANUP);
      expect(result.isDesync).toBe(true);
      expect(result.ctaType).toBe(MAPPING_DESYNC_CTA_TYPE.CLEANUP);
      expect(result.ctaLabel).toBe('일정 정리');
      expect(result.badgeLabel).toBe('일정 정리 필요');
      expect(result.tooltip).toBe('잔여 일정 정리 필요');
    });

    it('INACTIVE / SUSPENDED + nextDate → desync-cleanup', () => {
      expect(
        resolveMappingScheduleDesync({
          status: 'INACTIVE',
          nextConsultationDate: '2026-08-01'
        }).kind
      ).toBe(MAPPING_DESYNC_KIND.CLEANUP);
      expect(
        resolveMappingScheduleDesync({
          status: 'SUSPENDED',
          nextConsultationDate: '2026-08-01'
        }).kind
      ).toBe(MAPPING_DESYNC_KIND.CLEANUP);
    });

    it('PENDING_PAYMENT (비 Option-B) + nextDate → desync-cancel', () => {
      const result = resolveMappingScheduleDesync({
        status: 'PENDING_PAYMENT',
        paymentTiming: 'ADVANCE',
        nextConsultationDate: '2026-07-25'
      });
      expect(result.kind).toBe(MAPPING_DESYNC_KIND.CANCEL);
      expect(result.ctaType).toBe(MAPPING_DESYNC_CTA_TYPE.CANCEL);
      expect(result.badgeLabel).toBe('매칭 취소 필요');
      expect(result.tooltip).toBe('매칭을 취소해 주세요');
    });

    it('PENDING_PAYMENT Option-B + nextDate → desync 아님', () => {
      const result = resolveMappingScheduleDesync({
        status: 'PENDING_PAYMENT',
        paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
        nextConsultationDate: '2026-07-25'
      });
      expect(result.kind).toBe(MAPPING_DESYNC_KIND.NONE);
      expect(result.isDesync).toBe(false);
      expect(result.ctaType).toBeNull();
    });

    it('ACTIVE + remainingSessions <= 0 → desync-status', () => {
      const result = resolveMappingScheduleDesync({
        status: 'ACTIVE',
        remainingSessions: 0,
        nextConsultationDate: null
      });
      expect(result.kind).toBe(MAPPING_DESYNC_KIND.STATUS);
      expect(result.ctaType).toBe(MAPPING_DESYNC_CTA_TYPE.COMPLETE);
      expect(result.ctaLabel).toBe('완료 처리');
      expect(result.badgeLabel).toBe('상태 불일치');
      expect(result.tooltip).toBe('완료 처리해 주세요');
    });

    it('ACTIVE + remaining > 0 → none', () => {
      expect(
        resolveMappingScheduleDesync({
          status: 'ACTIVE',
          remainingSessions: 2,
          nextConsultationDate: '2026-07-20'
        }).kind
      ).toBe(MAPPING_DESYNC_KIND.NONE);
    });

    it('hasConsultationSchedule false alone is not desync', () => {
      expect(
        resolveMappingScheduleDesync({
          status: 'ACTIVE',
          remainingSessions: 3,
          hasConsultationSchedule: false,
          nextConsultationDate: null
        }).kind
      ).toBe(MAPPING_DESYNC_KIND.NONE);
    });

    it('empty mapping → none', () => {
      expect(resolveMappingScheduleDesync(undefined).kind).toBe(MAPPING_DESYNC_KIND.NONE);
      expect(resolveMappingScheduleDesync(null).kind).toBe(MAPPING_DESYNC_KIND.NONE);
    });
  });
});
