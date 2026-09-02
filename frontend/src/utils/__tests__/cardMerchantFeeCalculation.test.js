import {
  calculateCardMerchantFee,
  CARD_MERCHANT_FEE_EFFECTIVE_FROM,
  isCardMerchantFeeEffectiveDate,
  isCardPaymentMethod,
  resolveCardMerchantFeeAmount
} from '../cardMerchantFeeCalculation';

const PAYMENT_METHOD_CODES = [
  {
    codeValue: 'CASH',
    extraData: '{"cardMerchantFeeEligible":false}'
  },
  {
    codeValue: 'BANK_TRANSFER',
    extraData: '{"cardMerchantFeeEligible":false,"legacyAliases":["TRANSFER"]}'
  },
  {
    codeValue: 'CREDIT_CARD',
    extraData: '{"cardMerchantFeeEligible":true,"legacyAliases":["CARD","카드"]}'
  },
  {
    codeValue: 'DEBIT_CARD',
    extraData: '{"cardMerchantFeeEligible":true}'
  },
  {
    codeValue: 'CARD_TERMINAL',
    extraData: '{"cardMerchantFeeEligible":true}'
  }
];

describe('cardMerchantFeeCalculation', () => {
  it('calculateCardMerchantFee: 100000 × 2.5% = 2500', () => {
    expect(calculateCardMerchantFee(100000, 2.5)).toBe(2500);
  });

  it('isCardMerchantFeeEffectiveDate: before Sept 2026 → false; on/after → true', () => {
    expect(isCardMerchantFeeEffectiveDate('2026-08-31')).toBe(false);
    expect(isCardMerchantFeeEffectiveDate(null)).toBe(false);
    expect(isCardMerchantFeeEffectiveDate('2026-09-01')).toBe(true);
    expect(isCardMerchantFeeEffectiveDate('2026-09-15')).toBe(true);
    expect(CARD_MERCHANT_FEE_EFFECTIVE_FROM).toBe('2026-09-01');
  });

  it('isCardPaymentMethod: CREDIT_CARD, DEBIT_CARD, CARD_TERMINAL, legacy CARD → true; CASH/BANK_TRANSFER → false', () => {
    expect(isCardPaymentMethod('CREDIT_CARD', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('credit_card', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('DEBIT_CARD', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('CARD_TERMINAL', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('CARD', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('카드', PAYMENT_METHOD_CODES)).toBe(true);
    expect(isCardPaymentMethod('CASH', PAYMENT_METHOD_CODES)).toBe(false);
    expect(isCardPaymentMethod('BANK_TRANSFER', PAYMENT_METHOD_CODES)).toBe(false);
  });

  it('resolveCardMerchantFeeAmount: CREDIT_CARD post-Sept 90000 × 2.08% = 1872', () => {
    const settings = { averageRatePercent: 2.08 };
    expect(resolveCardMerchantFeeAmount(settings, 90000, 'CREDIT_CARD', null, '2026-09-01', PAYMENT_METHOD_CODES)).toBe(1872);
  });
});
