/**
 * institutionLinkBillingDisplay — 전 INSTITUTION_LINK 공통 (고객 ID 특례 금지)
 */

import {
  buildInstitutionLinkMonthBillingSummary,
  excludeInitialConsultationFromSchedules,
  formatInstitutionLinkMonthlyAmount,
  hasInstitutionLinkInitialPaymentCompleted,
  isInstitutionLinkMapping,
  isNearMonthEnd,
  joinBillingDateLabels,
  resolveDaysUntilMonthEnd,
  resolveInitialConsultationScheduleId,
  shouldShowMonthEndInstitutionBillingReminder
} from '../institutionLinkBillingDisplay';
import { MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS } from '../../constants/institutionLinkBillingReminderConstants';

describe('institutionLinkBillingDisplay', () => {
  describe('hasInstitutionLinkInitialPaymentCompleted', () => {
    it('shows completed only when finance enrich flag is true', () => {
      expect(hasInstitutionLinkInitialPaymentCompleted({
        hasInstitutionLinkInitialPayment: true,
        institutionLinkPrepaidAmount: 100000
      })).toBe(true);
    });

    it('accepts initialConsultationPayment FT object without boolean flag', () => {
      expect(hasInstitutionLinkInitialPaymentCompleted({
        initialConsultationPayment: {
          financialTransactionId: 241,
          amount: 90000,
          transactionDate: '2026-09-07'
        },
        institutionLinkPrepaidAmount: 100000
      })).toBe(true);
    });

    it('ignores prepaid amount / contract fields without finance flag', () => {
      expect(hasInstitutionLinkInitialPaymentCompleted({
        institutionLinkPrepaidAmount: 100000,
        prepaidAmount: 100000
      })).toBe(false);
      expect(hasInstitutionLinkInitialPaymentCompleted({
        hasInstitutionLinkInitialPayment: false
      })).toBe(false);
      expect(hasInstitutionLinkInitialPaymentCompleted(null)).toBe(false);
    });
  });

  describe('month-end reminder', () => {
    it('resolves days until month end', () => {
      expect(resolveDaysUntilMonthEnd(new Date(2026, 8, 26))).toBe(4);
      expect(resolveDaysUntilMonthEnd(new Date(2026, 8, 30))).toBe(0);
    });

    it('uses default N-day window constant', () => {
      expect(MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS).toBe(5);
      expect(isNearMonthEnd(new Date(2026, 8, 25))).toBe(true);
      expect(isNearMonthEnd(new Date(2026, 8, 24))).toBe(false);
    });

    it('shows reminder only for institution-link near month end', () => {
      const near = new Date(2026, 8, 28);
      const early = new Date(2026, 8, 10);
      expect(shouldShowMonthEndInstitutionBillingReminder({
        paymentTiming: 'INSTITUTION_LINK'
      }, near)).toBe(true);
      expect(shouldShowMonthEndInstitutionBillingReminder({
        paymentTiming: 'INSTITUTION_LINK'
      }, early)).toBe(false);
      expect(shouldShowMonthEndInstitutionBillingReminder({
        paymentTiming: 'ADVANCE'
      }, near)).toBe(false);
      expect(isInstitutionLinkMapping({ clientEngagementType: 'INSTITUTION_LINK' })).toBe(true);
    });
  });

  describe('monthly billing excluding initial', () => {
    const baseSchedules = [
      { id: 373, date: '2026-08-31', status: 'COMPLETED' },
      { id: 378, date: '2026-09-07', status: 'COMPLETED' },
      { id: 436, date: '2026-09-14', status: 'COMPLETED' }
    ];

    const ilMapping = {
      paymentTiming: 'INSTITUTION_LINK',
      packagePrice: 90000,
      initialConsultationPayment: {
        financialTransactionId: 241,
        amount: 90000,
        transactionDate: '2026-09-07'
      },
      institutionLinkMonthlyAmount: 180000,
      institutionLinkConsultationSchedules: baseSchedules
    };

    it('identifies initial consultation by FT transaction date', () => {
      expect(resolveInitialConsultationScheduleId(
        ilMapping,
        ilMapping.institutionLinkConsultationSchedules
      )).toBe(378);
    });

    it('excludes initial from monthly billing schedules', () => {
      const filtered = excludeInitialConsultationFromSchedules(
        ilMapping,
        ilMapping.institutionLinkConsultationSchedules
      );
      expect(filtered.map((s) => s.id)).toEqual([373, 436]);
    });

    it('builds current-month summary with count, dates, packagePrice × count', () => {
      const summary = buildInstitutionLinkMonthBillingSummary(
        ilMapping,
        new Date(2026, 8, 20)
      );
      expect(summary).toMatchObject({
        year: 2026,
        month: 9,
        count: 1,
        dateLabels: ['9/14'],
        datesGlance: '9/14',
        unitPrice: 90000,
        monthlyAmount: 90000,
        monthlyAmountLabel: '90,000원',
        countLabel: '1회'
      });
      expect(joinBillingDateLabels(summary.dateLabels)).toBe('9/14');
      expect(formatInstitutionLinkMonthlyAmount(0)).toBe('');
    });

    it('falls back to contract monthly amount when packagePrice missing', () => {
      const summary = buildInstitutionLinkMonthBillingSummary({
        paymentTiming: 'INSTITUTION_LINK',
        institutionLinkMonthlyAmount: 180000,
        initialConsultationPayment: {
          financialTransactionId: 241,
          transactionDate: '2026-09-07'
        },
        institutionLinkConsultationSchedules: baseSchedules
      }, new Date(2026, 8, 20));
      expect(summary.monthlyAmount).toBe(180000);
      expect(summary.count).toBe(1);
    });

    it('returns null for non-IL mapping', () => {
      expect(buildInstitutionLinkMonthBillingSummary({
        paymentTiming: 'ADVANCE'
      })).toBeNull();
    });
  });
});
