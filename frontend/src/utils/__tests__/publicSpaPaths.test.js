/**
 * 공개 SPA 경로 판별 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-16
 */

import { isPublicClientShopPath, isPublicSpaPath } from '../publicSpaPaths';

describe('publicSpaPaths', () => {
  test('카탈로그·SKU만 공개 쇼핑 경로로 인정한다', () => {
    expect(isPublicClientShopPath('/client/shop')).toBe(true);
    expect(isPublicClientShopPath('/client/shop/sku/ABC')).toBe(true);
    expect(isPublicClientShopPath('/client/shop/cart')).toBe(false);
    expect(isPublicClientShopPath('/client/shop/checkout')).toBe(false);
    expect(isPublicClientShopPath('/client/shop/orders')).toBe(false);
    expect(isPublicClientShopPath('/client/shop/points')).toBe(false);
  });

  test('isPublicSpaPath에 공개 쇼핑 경로가 포함된다', () => {
    expect(isPublicSpaPath('/client/shop')).toBe(true);
    expect(isPublicSpaPath('/client/shop/sku/X')).toBe(true);
    expect(isPublicSpaPath('/client/shop/checkout')).toBe(false);
    expect(isPublicSpaPath('/login')).toBe(true);
  });
});
