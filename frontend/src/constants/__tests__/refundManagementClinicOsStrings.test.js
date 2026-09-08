/**
 * refundManagementClinicOsStrings — copy + FE ERP reflected heuristic
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import {
  RM_PAGE_TITLE,
  RM_MAIN_ARIA_LABEL,
  RM_SUMMARY,
  RM_COLLAPSE,
  buildRefundRailTitle,
  isRefundErpReflected
} from '../refundManagementClinicOsStrings';

describe('refundManagementClinicOsStrings', () => {
  test('page title is 환불 관리 without legacy 시스템 copy', () => {
    expect(RM_PAGE_TITLE).toBe('환불 관리');
    expect(RM_MAIN_ARIA_LABEL).toBe('환불 관리 콘텐츠');
    expect(RM_PAGE_TITLE).not.toMatch(/시스템/);
  });

  test('summary labels match Clinic-OS 3-cell strip', () => {
    expect(RM_SUMMARY.COUNT_LABEL).toBe('환불 건수');
    expect(RM_SUMMARY.AMOUNT_LABEL).toBe('환불 금액');
    expect(RM_SUMMARY.PENDING_ERP_LABEL).toBe('ERP 미반영');
    expect(RM_SUMMARY.BAND_ARIA).toBe('환불 관리 요약');
  });

  test('collapse titles', () => {
    expect(RM_COLLAPSE.REASON).toBe('사유 통계');
    expect(RM_COLLAPSE.ERP).toBe('ERP 상세');
    expect(RM_COLLAPSE.ACCOUNTING).toBe('회계');
  });

  test('buildRefundRailTitle', () => {
    expect(buildRefundRailTitle(3)).toBe('ERP 미반영 3건 · 합계');
    expect(buildRefundRailTitle(0)).toBe('ERP 미반영 0건 · 합계');
  });

  test('isRefundErpReflected FE heuristic', () => {
    expect(isRefundErpReflected({ erpReference: 'ERP-1' })).toBe(true);
    expect(isRefundErpReflected({ erpStatus: 'SENT' })).toBe(true);
    expect(isRefundErpReflected({ erpStatus: 'reflected' })).toBe(true);
    expect(isRefundErpReflected({ erpStatus: 'SYNCED' })).toBe(true);
    expect(isRefundErpReflected({ erpStatus: 'PENDING' })).toBe(false);
    expect(isRefundErpReflected({})).toBe(false);
    expect(isRefundErpReflected(null)).toBe(false);
  });
});
