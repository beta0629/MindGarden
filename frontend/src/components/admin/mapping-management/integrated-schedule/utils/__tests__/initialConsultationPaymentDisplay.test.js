/**
 * initialConsultationPaymentDisplay — FT SSOT, prepaid denorm 무시
 */

import {
  formatInitialConsultationPaymentAmount,
  resolveInitialConsultationPayment
} from '../initialConsultationPaymentDisplay';

describe('initialConsultationPaymentDisplay', () => {
  it('resolves FT amount and ignores contract prepaid 100000 DATAFIX', () => {
    const resolved = resolveInitialConsultationPayment({
      institutionLinkPrepaidAmount: 100000,
      prepaidAmount: 100000,
      initialConsultationPayment: {
        financialTransactionId: 241,
        amount: 90000,
        transactionDate: '2026-09-07',
        status: 'COMPLETED',
        relatedMappingId: 265,
        relatedEntityType: 'INSTITUTION_LINK_PREPAID'
      }
    });
    expect(resolved).toEqual({
      amount: 90000,
      transactionDate: '2026-09-07',
      status: 'COMPLETED',
      financialTransactionId: 241,
      relatedMappingId: 265
    });
    expect(formatInitialConsultationPaymentAmount(resolved.amount)).toBe('90,000원');
  });

  it('returns null when only prepaid denorm exists (no FT)', () => {
    expect(resolveInitialConsultationPayment({
      institutionLinkPrepaidAmount: 100000,
      prepaidAmount: 100000
    })).toBeNull();
  });

  it('returns null for zero or missing amount', () => {
    expect(resolveInitialConsultationPayment({
      initialConsultationPayment: { amount: 0, status: 'COMPLETED' }
    })).toBeNull();
  });
});
