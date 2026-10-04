import {
  buildPaymentMethodLabelMap,
  filterCheckoutSameDayPaymentMethodCodes,
  isCardMerchantFeeEligibleFromCodes,
  isCardPaymentMethod,
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
  describe('isCardPaymentMethod — 결제 승인번호 행 노출 기준', () => {
    it('공통코드가 있으면 extra_data cardMerchantFeeEligible 이 기준', () => {
      expect(isCardPaymentMethod('CREDIT_CARD', CHECKOUT_CODES)).toBe(true);
      expect(isCardPaymentMethod('DEBIT_CARD', CHECKOUT_CODES)).toBe(true);
      expect(isCardPaymentMethod('CASH', CHECKOUT_CODES)).toBe(false);
      expect(isCardPaymentMethod(PAYMENT_METHOD_CODE_BANK_TRANSFER, CHECKOUT_CODES)).toBe(false);
      expect(isCardPaymentMethod(PAYMENT_METHOD_CODE_OTHER, CHECKOUT_CODES)).toBe(false);
    });

    it('레거시 별칭(CARD)은 공통코드 canonical 행으로 판정', () => {
      expect(isCardPaymentMethod('CARD', CODES)).toBe(true);
      expect(isCardPaymentMethod('카드', CODES)).toBe(true);
    });

    it('공통코드가 없으면 백엔드 SSOT 상수 기준 폴백(카드·체크·단말·레거시 CARD)', () => {
      expect(isCardPaymentMethod('CREDIT_CARD')).toBe(true);
      expect(isCardPaymentMethod('card_terminal')).toBe(true);
      expect(isCardPaymentMethod('CARD')).toBe(true);
      expect(isCardPaymentMethod('CASH')).toBe(false);
      expect(isCardPaymentMethod('BANK_TRANSFER')).toBe(false);
      expect(isCardPaymentMethod('OTHER')).toBe(false);
    });

    it('빈 값·비문자열은 false', () => {
      expect(isCardPaymentMethod(null)).toBe(false);
      expect(isCardPaymentMethod('')).toBe(false);
      expect(isCardPaymentMethod('  ')).toBe(false);
      expect(isCardPaymentMethod(1)).toBe(false);
    });
  });
});
