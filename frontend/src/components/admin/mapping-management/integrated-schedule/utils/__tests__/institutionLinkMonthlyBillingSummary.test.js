/**
 * institutionLinkMonthlyBillingSummary / month billing — 단가×횟수 + 유연 모드
 */

import {
  buildInstitutionLinkMonthBillingSummary,
  resolveInstitutionLinkSessionUnitPrice
} from '../institutionLinkBillingDisplay';

describe('buildInstitutionLinkMonthBillingSummary', () => {
  const schedules = [
    { id: 1, date: '2026-08-31', status: 'COMPLETED', startTime: '14:00' },
    { id: 2, date: '2026-09-07', status: 'COMPLETED', startTime: '14:00' },
    { id: 3, date: '2026-09-14', status: 'COMPLETED', startTime: '14:00' },
    { id: 4, date: '2026-09-21', status: 'BOOKED', startTime: '14:00' }
  ];

  const separateMapping = {
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
    institutionLinkConsultationSchedules: schedules
  };

  it('uses packagePrice and ignores prepaid 100000 DATAFIX', () => {
    expect(resolveInstitutionLinkSessionUnitPrice(separateMapping)).toBe(90000);
    expect(resolveInstitutionLinkSessionUnitPrice({
      paymentTiming: 'INSTITUTION_LINK',
      institutionLinkPrepaidAmount: 100000
    })).toBeNull();
  });

  it('SEPARATE: excludes initial payment date and builds unit×count for September', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary(separateMapping, ref);
    expect(summary).toMatchObject({
      year: 2026,
      month: 9,
      count: 2,
      unitPrice: 90000,
      monthlyAmount: 180000,
      countLabel: '2회',
      monthlyAmountLabel: '180,000원',
      billingComposition: 'SEPARATE',
      excludesInitialConsultation: true
    });
    expect(summary.dateLabels).toEqual(['9/7', '9/14']);
  });

  it('MONTHLY_COMBINED: includes all completed sessions in month for charge total', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary({
      paymentTiming: 'INSTITUTION_LINK',
      packagePrice: 90000,
      institutionLinkConsultationSchedules: schedules
    }, ref);
    expect(summary).toMatchObject({
      count: 2,
      monthlyAmount: 180000,
      billingComposition: 'MONTHLY_COMBINED',
      excludesInitialConsultation: false
    });
    expect(summary.dateLabels).toEqual(['9/7', '9/14']);
  });

  it('MONTHLY_COMBINED with initial in same month: counts initial in total', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary({
      paymentTiming: 'INSTITUTION_LINK',
      packagePrice: 90000,
      institutionLinkBillingComposition: 'MONTHLY_COMBINED',
      institutionLinkConsultationSchedules: [
        { id: 10, date: '2026-09-01', status: 'COMPLETED' },
        { id: 11, date: '2026-09-14', status: 'COMPLETED' }
      ]
    }, ref);
    expect(summary).toMatchObject({
      count: 2,
      monthlyAmount: 180000,
      dateLabels: ['9/1', '9/14'],
      billingComposition: 'MONTHLY_COMBINED'
    });
  });

  it('ALL_COMBINED: prefers contract monthly lump', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary({
      paymentTiming: 'INSTITUTION_LINK',
      packagePrice: 90000,
      institutionLinkMonthlyAmount: 500000,
      institutionLinkConsultationSchedules: schedules
    }, ref);
    expect(summary).toMatchObject({
      count: 2,
      monthlyAmount: 500000,
      billingComposition: 'ALL_COMBINED',
      excludesInitialConsultation: false
    });
  });

  it('falls back to contract monthly amount when packagePrice missing (SEPARATE)', () => {
    const ref = new Date(2026, 8, 16);
    const summary = buildInstitutionLinkMonthBillingSummary({
      ...separateMapping,
      packagePrice: null
    }, ref);
    expect(summary.monthlyAmount).toBe(500000);
    expect(summary.count).toBe(2);
    expect(summary.billingComposition).toBe('SEPARATE');
  });

  it('returns null for non-IL mapping', () => {
    expect(buildInstitutionLinkMonthBillingSummary({
      paymentTiming: 'ADVANCE',
      packagePrice: 90000
    }, new Date(2026, 8, 16))).toBeNull();
  });
});
