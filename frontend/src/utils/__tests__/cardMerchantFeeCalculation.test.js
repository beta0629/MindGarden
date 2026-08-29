import {
  calculateCardMerchantFee,
  CARD_MERCHANT_FEE_EFFECTIVE_FROM,
  isCardMerchantFeeEffectiveDate,
  resolveCardMerchantFeeAmount,
  resolveCardMerchantFeeRate
} from '../cardMerchantFeeCalculation';

describe('cardMerchantFeeCalculation', () => {
  it('100000 × 2.5% = 2500', () => {
    expect(calculateCardMerchantFee(100000, 2.5)).toBe(2500);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calculateCardMerchantFee(null, 2.5)).toBe(0);
    expect(calculateCardMerchantFee(1000, null)).toBe(0);
  });

  it('resolveCardMerchantFeeRate uses average only (ignores issuer)', () => {
    const settings = {
      averageRatePercent: 2.5,
      issuerRates: [{ issuerLabel: '신한', ratePercent: 3.0 }]
    };
    expect(resolveCardMerchantFeeRate(settings, '신한')).toBe(2.5);
    expect(resolveCardMerchantFeeRate(settings, null)).toBe(2.5);
  });

  it('date gate: before 2026-09-01 → false, on/after → true', () => {
    expect(CARD_MERCHANT_FEE_EFFECTIVE_FROM).toBe('2026-09-01');
    expect(isCardMerchantFeeEffectiveDate('2026-08-31')).toBe(false);
    expect(isCardMerchantFeeEffectiveDate(null)).toBe(false);
    expect(isCardMerchantFeeEffectiveDate('2026-09-01')).toBe(true);
    expect(isCardMerchantFeeEffectiveDate('2026-09-15')).toBe(true);
  });

  it('resolveCardMerchantFeeAmount: pre-Sept → 0, post-Sept average', () => {
    const settings = {
      averageRatePercent: 2.5,
      issuerRates: [{ issuerLabel: '신한', ratePercent: 3.0 }]
    };
    expect(resolveCardMerchantFeeAmount(settings, 100000, 'CARD', '신한', '2026-08-31')).toBe(0);
    expect(resolveCardMerchantFeeAmount(settings, 100000, 'CARD', '신한', '2026-09-01')).toBe(2500);
    expect(resolveCardMerchantFeeAmount(settings, 100000, 'CASH', null, '2026-09-01')).toBe(0);
  });
});
