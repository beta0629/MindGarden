/**
 * shopSessionCount 유틸 단위 테스트
 */

import {
  SHOP_PACKAGE_TYPE,
  isShopSingleSession,
  normalizeShopSessionCount,
  resolveShopPackageType
} from '../shopSessionCount';

describe('shopSessionCount', () => {
  test('normalizeShopSessionCount — 최소 1', () => {
    expect(normalizeShopSessionCount(null)).toBe(1);
    expect(normalizeShopSessionCount(0)).toBe(1);
    expect(normalizeShopSessionCount(5)).toBe(5);
  });

  test('resolveShopPackageType', () => {
    expect(resolveShopPackageType(1)).toBe(SHOP_PACKAGE_TYPE.SINGLE);
    expect(resolveShopPackageType(10)).toBe(SHOP_PACKAGE_TYPE.PACKAGE);
  });

  test('isShopSingleSession', () => {
    expect(isShopSingleSession(1)).toBe(true);
    expect(isShopSingleSession(2)).toBe(false);
  });
});
