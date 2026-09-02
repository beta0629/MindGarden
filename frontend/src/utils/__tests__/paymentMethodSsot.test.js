import {
  buildPaymentMethodLabelMap,
  isCardMerchantFeeEligibleFromCodes,
  normalizePaymentMethodCodeValue,
  parseCardMerchantFeeEligible,
  resolvePaymentMethodCode
} from '../paymentMethodSsot';

const CODES = [
  {
    codeValue: 'CREDIT_CARD',
    codeLabel: '신용카드',
    extraData: '{"cardMerchantFeeEligible":true,"legacyAliases":["CARD","카드"]}'
  },
  {
    codeValue: 'CASH',
    codeLabel: '현금',
    extraData: '{"cardMerchantFeeEligible":false}'
  }
];

describe('paymentMethodSsot', () => {
  it('parseCardMerchantFeeEligible reads extra_data flag', () => {
    expect(parseCardMerchantFeeEligible('{"cardMerchantFeeEligible":true}')).toBe(true);
    expect(parseCardMerchantFeeEligible('{"cardMerchantFeeEligible":false}')).toBe(false);
  });

  it('resolvePaymentMethodCode matches legacy alias', () => {
    expect(resolvePaymentMethodCode('CARD', CODES)?.codeValue).toBe('CREDIT_CARD');
    expect(normalizePaymentMethodCodeValue('카드', CODES)).toBe('CREDIT_CARD');
  });

  it('isCardMerchantFeeEligibleFromCodes uses SSOT extra_data', () => {
    expect(isCardMerchantFeeEligibleFromCodes('CREDIT_CARD', CODES)).toBe(true);
    expect(isCardMerchantFeeEligibleFromCodes('CASH', CODES)).toBe(false);
  });

  it('buildPaymentMethodLabelMap builds code → label map', () => {
    expect(buildPaymentMethodLabelMap(CODES)).toEqual({
      CREDIT_CARD: '신용카드',
      CASH: '현금'
    });
  });
});
