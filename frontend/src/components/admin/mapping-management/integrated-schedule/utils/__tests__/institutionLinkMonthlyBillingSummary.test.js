/**
 * institutionLinkMonthlyBillingSummary / month billing — 단가×횟수
 */

import {
  buildInstitutionLinkMonthBillingSummary,
  resolveInstitutionLinkSessionUnitPrice
} from '../institutionLinkBillingDisplay';

describe('buildInstitutionLinkMonthBillingSummary', () => {
  const ilMapping = {
    paymentTiming: 'INSTITUTION_LINK',
    packagePrice: 90000,
    hasInstitutionLinkInitialPayment: true,
    institutionLinkPrepaidAmount: 100000,
    prepaidAmount: 100000,
    institutionLinkMonthlyAmount: 500000,
    initialConsultationPayment: {
      financialTransactionId: 241,
      amount: 90000,
      transactionDate: '2026-08-31',
      status: 'COMPLETED'
    },
    institutionLinkConsultationSchedules: [
      { id: 1, date: '2026-08-31', status: 'COMPLETED', startTime: '14:00' },
      { id: 2, date: '2026-09-07', status: 'COMPLETED', startTime: '14:00' },
      { id: 3, date: '2026-09-14', status: 'COMPLETED', startTime: '14:00' },
      { id: 4, date: '2026-09-21', status: 'BOOKED', startTime: '14:00' }
    ]
  };

  it('uses packagePrice and ignores prepaid 100000 DATAFIX', () => {
    expect(resolveInstitutionLinkSessionUnitPrice(ilMapping)).toBe(90000);
    expect(resolveInstitutionLinkSessionUnitPrice({
      paymentTiming: 'INSTITUTION_LINK',
      institutionLinkPrepaidAmount: 100000
    })).toBeNull();
  });

  it('excludes initial payment date and builds unit×count for September', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary(ilMapping, ref);
    expect(summary).toMatchObject({
      year: 2026,
      month: 9,
      count: 2,
      unitPrice: 90000,
      monthlyAmount: 180000,
      countLabel: '2회',
      monthlyAmountLabel: '180,000원'
    });
    expect(summary.dateLabels).toEqual(['9/7', '9/14']);
  });

  it('falls back to contract monthly amount when packagePrice missing', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary({
      ...ilMapping,
      packagePrice: null
    }, ref);
    expect(summary.monthlyAmount).toBe(500000);
    expect(summary.count).toBe(2);
  });

  it('returns null for non-IL mapping', () => {
    expect(buildInstitutionLinkMonthBillingSummary({
      paymentTiming: 'ADVANCE',
      packagePrice: 90000
    }, new Date(2026, 8, 16))).toBeNull();
  });
});
