import { calculateCardMerchantFee } from '../cardMerchantFeeCalculation';

describe('cardMerchantFeeCalculation', () => {
  it('100000 × 2.5% = 2500', () => {
    expect(calculateCardMerchantFee(100000, 2.5)).toBe(2500);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calculateCardMerchantFee(null, 2.5)).toBe(0);
    expect(calculateCardMerchantFee(1000, null)).toBe(0);
  });
});
