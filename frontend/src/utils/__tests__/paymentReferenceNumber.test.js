import {
  formatPaymentReferenceTimestamp,
  generatePaymentReferenceNumber
} from '../paymentReferenceNumber';

describe('paymentReferenceNumber', () => {
  const fixedNow = new Date(2026, 9, 2, 15, 14, 24);

  test('타임스탬프는 로컬 YYYYMMDD_HHmmss', () => {
    expect(formatPaymentReferenceTimestamp(fixedNow)).toBe('20261002_151424');
  });

  test('배정 생성과 동일한 접두어 규칙', () => {
    expect(generatePaymentReferenceNumber('BANK_TRANSFER', fixedNow)).toBe('BANK_20261002_151424');
    expect(generatePaymentReferenceNumber('CASH', fixedNow)).toBe('CASH_20261002_151424');
    expect(generatePaymentReferenceNumber('CARD', fixedNow)).toBe('CARD_20261002_151424');
    expect(generatePaymentReferenceNumber('CREDIT_CARD', fixedNow)).toBe('CREDIT_CARD_20261002_151424');
  });

  test('method 미지정 시 계좌이체 기본', () => {
    expect(generatePaymentReferenceNumber(undefined, fixedNow)).toBe('BANK_20261002_151424');
  });
});
