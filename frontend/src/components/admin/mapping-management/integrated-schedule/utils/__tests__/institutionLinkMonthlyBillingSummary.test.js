/**
 * institutionLinkMonthlyBillingSummary — 초기결제 제외 월 횟수·금액
 */

import {
  buildInstitutionLinkMonthlyBillingSummary,
  resolveInstitutionLinkSessionUnitPrice,
  resolveMonthlyBillableConsultationSchedules
} from '../institutionLinkMonthlyBillingSummary';

describe('institutionLinkMonthlyBillingSummary', () => {
  const ilMapping = {
    paymentTiming: 'INSTITUTION_LINK',
    packagePrice: 90000,
    hasInstitutionLinkInitialPayment: true,
    institutionLinkPrepaidAmount: 100000,
    prepaidAmount: 100000,
    initialConsultationPayment: {
      amount: 90000,
      transactionDate: '2026-08-31',
      status: 'COMPLETED'
    }
  };

  const unionSchedules = [
    { id: 1, date: '2026-08-31', status: 'COMPLETED', startTime: '14:00' },
    { id: 2, date: '2026-09-07', status: 'COMPLETED', startTime: '14:00' },
    { id: 3, date: '2026-09-14', status: 'COMPLETED', startTime: '14:00' },
    { id: 4, date: '2026-09-21', status: 'BOOKED', startTime: '14:00' }
  ];

  it('uses packagePrice unit and ignores prepaid 100000 DATAFIX', () => {
    expect(resolveInstitutionLinkSessionUnitPrice(ilMapping)).toBe(90000);
    expect(resolveInstitutionLinkSessionUnitPrice({
      paymentTiming: 'INSTITUTION_LINK',
      institutionLinkPrepaidAmount: 100000
    })).toBeNull();
  });

  it('excludes initial payment date and non-completed from September billable set', () => {
    const ref = new Date(2026, 8, 16);
    const billable = resolveMonthlyBillableConsultationSchedules(
      ilMapping,
      unionSchedules,
      ref
    );
    expect(billable.map((row) => row.date)).toEqual(['2026-09-07', '2026-09-14']);
  });

  it('builds monthly count and amount for institution bill copy', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthlyBillingSummary(
      ilMapping,
      unionSchedules,
      ref
    );
    expect(summary).toMatchObject({
      year: 2026,
      month: 9,
      sessionCount: 2,
      unitPrice: 90000,
      totalAmount: 180000,
      countLabel: '2회',
      amountLabel: '180,000원'
    });
    expect(summary.datesGlance).toBe('9월 7일 · 14일');
  });

  it('returns null for non-IL mapping', () => {
    expect(buildInstitutionLinkMonthlyBillingSummary(
      { paymentTiming: 'ADVANCE', packagePrice: 90000 },
      unionSchedules,
      new Date(2026, 8, 16)
    )).toBeNull();
  });

  it('when no initial payment, includes all completed days in month', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthlyBillingSummary(
      {
        paymentTiming: 'INSTITUTION_LINK',
        packagePrice: 90000,
        hasInstitutionLinkInitialPayment: false
      },
      unionSchedules,
      ref
    );
    expect(summary.sessionCount).toBe(2);
    expect(summary.totalAmount).toBe(180000);
  });
});
