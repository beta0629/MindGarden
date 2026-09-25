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

  it('SOURCE_LABELS separates channel from method (온라인 / 수동/센터 / 미확인)', () => {
    expect(PACKAGE_PAYMENT_HISTORY_UI.SOURCE_LABELS.ONLINE).toBe('온라인');
    expect(PACKAGE_PAYMENT_HISTORY_UI.SOURCE_LABELS.MANUAL).toBe('수동/센터');
    expect(PACKAGE_PAYMENT_HISTORY_UI.SOURCE_LABELS.UNKNOWN).toBe('미확인');
  });
});

describe('resolvePackagePaymentSourceLabel', () => {
  const {
    resolvePackagePaymentSourceLabel,
    resolvePackagePaymentSourceBadgeVariant,
    PACKAGE_PAYMENT_HISTORY_SOURCE
  } = require('../packagePaymentHistory');

  it('maps ONLINE/MANUAL/UNKNOWN labels', () => {
    expect(resolvePackagePaymentSourceLabel(PACKAGE_PAYMENT_HISTORY_SOURCE.ONLINE)).toBe('온라인');
    expect(resolvePackagePaymentSourceLabel('MANUAL')).toBe('수동/센터');
    expect(resolvePackagePaymentSourceLabel('UNKNOWN')).toBe('미확인');
  });

  it('hideUnknown returns null for UNKNOWN', () => {
    expect(resolvePackagePaymentSourceLabel('UNKNOWN', { hideUnknown: true })).toBeNull();
  });

  it('badge variants are distinct per source', () => {
    expect(resolvePackagePaymentSourceBadgeVariant('ONLINE')).toBe('success');
    expect(resolvePackagePaymentSourceBadgeVariant('MANUAL')).toBe('neutral');
    expect(resolvePackagePaymentSourceBadgeVariant('UNKNOWN')).toBe('warning');
  });
});
