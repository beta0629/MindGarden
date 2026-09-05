import {
  buildPaymentMethodLabelMap,
  filterCheckoutSameDayPaymentMethodCodes,
  isCardMerchantFeeEligibleFromCodes,
  isCheckoutSameDayPaymentMethodOption,
  mapPaymentMethodCodesToOptions,
  normalizePaymentMethodCodeValue,
  parseCardMerchantFeeEligible,
  PAYMENT_METHOD_CODE_BANK_TRANSFER,
  PAYMENT_METHOD_CODE_OTHER,
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

const CHECKOUT_CODES = [
  {
    codeValue: 'CREDIT_CARD',
    codeLabel: '신용카드',
    isActive: true,
    extraData: '{"cardMerchantFeeEligible":true}'
  },
  {
    codeValue: 'DEBIT_CARD',
    codeLabel: '체크카드',
    isActive: true,
    extraData: '{"cardMerchantFeeEligible":true}'
  },
  {
    codeValue: PAYMENT_METHOD_CODE_BANK_TRANSFER,
    codeLabel: '계좌이체',
    isActive: true,
    extraData: '{"cardMerchantFeeEligible":false}'
  },
  {
    codeValue: PAYMENT_METHOD_CODE_OTHER,
    codeLabel: '기타',
    isActive: true,
    extraData: '{"cardMerchantFeeEligible":false}'
  },
  {
    codeValue: 'CASH',
    codeLabel: '현금',
    isActive: true,
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

  describe('checkout same-day payment method filter', () => {
    it('isCheckoutSameDayPaymentMethodOption: card eligible + BANK_TRANSFER + OTHER, excludes CASH', () => {
      expect(isCheckoutSameDayPaymentMethodOption('CREDIT_CARD', CHECKOUT_CODES)).toBe(true);
      expect(isCheckoutSameDayPaymentMethodOption('DEBIT_CARD', CHECKOUT_CODES)).toBe(true);
      expect(isCheckoutSameDayPaymentMethodOption(PAYMENT_METHOD_CODE_BANK_TRANSFER, CHECKOUT_CODES)).toBe(true);
      expect(isCheckoutSameDayPaymentMethodOption(PAYMENT_METHOD_CODE_OTHER, CHECKOUT_CODES)).toBe(true);
      expect(isCheckoutSameDayPaymentMethodOption('CASH', CHECKOUT_CODES)).toBe(false);
    });

    it('BANK_TRANSFER remains cardMerchantFeeEligible false (fee path 제외)', () => {
      expect(
        isCardMerchantFeeEligibleFromCodes(PAYMENT_METHOD_CODE_BANK_TRANSFER, CHECKOUT_CODES)
      ).toBe(false);
    });

    it('filterCheckoutSameDayPaymentMethodCodes + mapPaymentMethodCodesToOptions', () => {
      const filtered = filterCheckoutSameDayPaymentMethodCodes(CHECKOUT_CODES);
      const options = mapPaymentMethodCodesToOptions(filtered);
      expect(options.map((o) => o.value)).toEqual([
        'CREDIT_CARD',
        'DEBIT_CARD',
        PAYMENT_METHOD_CODE_BANK_TRANSFER,
        PAYMENT_METHOD_CODE_OTHER
      ]);
      expect(options.map((o) => o.value)).not.toContain('CASH');
    });
  });
});
