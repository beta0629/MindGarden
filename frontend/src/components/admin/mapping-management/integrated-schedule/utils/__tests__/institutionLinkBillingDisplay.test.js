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
  resolveInstitutionLinkBillingComposition,
  resolveInstitutionLinkInitialBillingMode,
  shouldExcludeInitialConsultationFromMonthlyBilling,
  shouldShowInstitutionLinkInitialPaymentUi,
  shouldShowMonthEndInstitutionBillingReminder
} from '../institutionLinkBillingDisplay';
import {
  INSTITUTION_LINK_BILLING_COMPOSITION,
  MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS
} from '../../constants/institutionLinkBillingReminderConstants';

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

  describe('resolveInstitutionLinkBillingComposition', () => {
    it('defaults to MONTHLY_COMBINED when no FT and no contract monthly', () => {
      expect(resolveInstitutionLinkBillingComposition({
        paymentTiming: 'INSTITUTION_LINK'
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.MONTHLY_COMBINED);
      expect(shouldExcludeInitialConsultationFromMonthlyBilling({
        paymentTiming: 'INSTITUTION_LINK'
      })).toBe(false);
      expect(shouldShowInstitutionLinkInitialPaymentUi({
        paymentTiming: 'INSTITUTION_LINK'
      })).toBe(false);
    });

    it('infers SEPARATE from FT enrich', () => {
      const mapping = {
        paymentTiming: 'INSTITUTION_LINK',
        hasInstitutionLinkInitialPayment: true,
        institutionLinkMonthlyAmount: 180000,
        initialConsultationPayment: { financialTransactionId: 1, amount: 90000 }
      };
      expect(resolveInstitutionLinkBillingComposition(mapping))
        .toBe(INSTITUTION_LINK_BILLING_COMPOSITION.SEPARATE);
      expect(shouldShowInstitutionLinkInitialPaymentUi(mapping)).toBe(true);
    });

    it('infers ALL_COMBINED from contract monthly when no FT', () => {
      expect(resolveInstitutionLinkBillingComposition({
        paymentTiming: 'INSTITUTION_LINK',
        institutionLinkMonthlyAmount: 500000
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.ALL_COMBINED);
    });

    it('honors explicit institutionLinkBillingComposition over FT', () => {
      expect(resolveInstitutionLinkBillingComposition({
        hasInstitutionLinkInitialPayment: true,
        institutionLinkBillingComposition: 'MONTHLY_COMBINED'
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.MONTHLY_COMBINED);
      expect(shouldShowInstitutionLinkInitialPaymentUi({
        hasInstitutionLinkInitialPayment: true,
        institutionLinkBillingComposition: 'MONTHLY_COMBINED'
      })).toBe(false);
      expect(resolveInstitutionLinkBillingComposition({
        institutionLinkBillingComposition: 'ALL_COMBINED'
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.ALL_COMBINED);
    });

    it('maps legacy COMBINED to MONTHLY_COMBINED', () => {
      expect(resolveInstitutionLinkInitialBillingMode({
        institutionLinkInitialBillingMode: 'COMBINED'
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.MONTHLY_COMBINED);
      expect(resolveInstitutionLinkBillingComposition({
        institutionLinkInitialBillingMode: 'SEPARATE'
      })).toBe(INSTITUTION_LINK_BILLING_COMPOSITION.SEPARATE);
      expect(shouldShowInstitutionLinkInitialPaymentUi({
        institutionLinkInitialBillingMode: 'SEPARATE'
      })).toBe(false);
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

  describe('monthly billing SEPARATE vs combined modes', () => {
    const baseSchedules = [
      { id: 373, date: '2026-08-31', status: 'COMPLETED' },
      { id: 378, date: '2026-09-07', status: 'COMPLETED' },
      { id: 436, date: '2026-09-14', status: 'COMPLETED' }
    ];

    const separateMapping = {
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
        separateMapping,
        separateMapping.institutionLinkConsultationSchedules
      )).toBe(378);
    });

    it('excludes initial from monthly billing when SEPARATE (FT)', () => {
      const filtered = excludeInitialConsultationFromSchedules(
        separateMapping,
        separateMapping.institutionLinkConsultationSchedules
      );
      expect(filtered.map((s) => s.id)).toEqual([373, 436]);
    });

    it('includes all month sessions when MONTHLY_COMBINED (no FT)', () => {
      const combined = {
        paymentTiming: 'INSTITUTION_LINK',
        packagePrice: 90000,
        institutionLinkConsultationSchedules: baseSchedules
      };
      const filtered = excludeInitialConsultationFromSchedules(
        combined,
        combined.institutionLinkConsultationSchedules
      );
      expect(filtered.map((s) => s.id)).toEqual([373, 378, 436]);
      const summary = buildInstitutionLinkMonthBillingSummary(
        combined,
        new Date(2026, 8, 20)
      );
      expect(summary).toMatchObject({
        year: 2026,
        month: 9,
        count: 2,
        dateLabels: ['9/7', '9/14'],
        monthlyAmount: 180000,
        billingComposition: 'MONTHLY_COMBINED',
        initialBillingMode: 'MONTHLY_COMBINED',
        excludesInitialConsultation: false
      });
    });

    it('ALL_COMBINED prefers contract monthly amount', () => {
      const summary = buildInstitutionLinkMonthBillingSummary({
        paymentTiming: 'INSTITUTION_LINK',
        packagePrice: 90000,
        institutionLinkMonthlyAmount: 500000,
        institutionLinkConsultationSchedules: baseSchedules
      }, new Date(2026, 8, 20));
      expect(summary).toMatchObject({
        count: 2,
        monthlyAmount: 500000,
        billingComposition: 'ALL_COMBINED',
        excludesInitialConsultation: false
      });
    });

    it('builds SEPARATE current-month summary excluding initial', () => {
      const summary = buildInstitutionLinkMonthBillingSummary(
        separateMapping,
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
        countLabel: '1회',
        billingComposition: 'SEPARATE',
        initialBillingMode: 'SEPARATE',
        excludesInitialConsultation: true
      });
      expect(joinBillingDateLabels(summary.dateLabels)).toBe('9/14');
      expect(formatInstitutionLinkMonthlyAmount(0)).toBe('');
    });

    it('falls back to contract monthly amount when packagePrice missing (SEPARATE)', () => {
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
      expect(summary.billingComposition).toBe('SEPARATE');
    });

    it('returns null for non-IL mapping', () => {
      expect(buildInstitutionLinkMonthBillingSummary({
        paymentTiming: 'ADVANCE'
      })).toBeNull();
    });
  });
});
