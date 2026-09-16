/**
 * packagePaymentHistory — 날짜 캡션은 최초 상담일과 혼동 금지
 */
import {
  PACKAGE_PAYMENT_HISTORY_TYPE,
  PACKAGE_PAYMENT_HISTORY_UI,
  resolvePackagePaymentHistoryDateLabel
} from '../packagePaymentHistory';

describe('resolvePackagePaymentHistoryDateLabel', () => {
  it('INITIAL_MAPPING uses 배정·생성일 (not 최초 상담일)', () => {
    expect(
      resolvePackagePaymentHistoryDateLabel(PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING)
    ).toBe('배정·생성일');
    expect(
      resolvePackagePaymentHistoryDateLabel(PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING)
    ).not.toBe('최초 상담일');
  });

  it('ADDITIONAL_PACKAGE and SESSION_EXTENSION use 결제일', () => {
    expect(
      resolvePackagePaymentHistoryDateLabel(PACKAGE_PAYMENT_HISTORY_TYPE.ADDITIONAL_PACKAGE)
    ).toBe('결제일');
    expect(
      resolvePackagePaymentHistoryDateLabel(PACKAGE_PAYMENT_HISTORY_TYPE.SESSION_EXTENSION)
    ).toBe('결제일');
  });

  it('unknown type falls back to 일자', () => {
    expect(resolvePackagePaymentHistoryDateLabel('UNKNOWN')).toBe('일자');
    expect(resolvePackagePaymentHistoryDateLabel(null)).toBe('일자');
  });

  it('TYPE_LABELS.INITIAL_MAPPING stays 최초 배정 (assignment, not consultation)', () => {
    expect(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING).toBe('최초 배정');
  });
});
