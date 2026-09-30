/**
 * clientMallBuyNow — 바로 구매 주소·체크아웃 라인 (장바구니 미사용)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { CLIENT_MALL_LIMITS, CLIENT_MALL_ROUTES } from '../../constants/clientMallConstants';
import {
  buildBuyNowCheckoutPath,
  clampBuyNowQuantity,
  parseBuyNowQuery,
  toBuyNowCheckoutLines
} from '../clientMallBuyNow';

describe('clientMallBuyNow', () => {
  test('경로 → 파싱 왕복', () => {
    const path = buildBuyNowCheckoutPath('PKG10', 2);
    expect(path.startsWith(`${CLIENT_MALL_ROUTES.CHECKOUT}?`)).toBe(true);
    const search = path.slice(path.indexOf('?'));
    expect(parseBuyNowQuery(search)).toEqual({ skuCode: 'PKG10', quantity: 2 });
  });

  test('수량 기본 1 · 범위 밖은 잘라냄', () => {
    expect(parseBuyNowQuery(buildBuyNowCheckoutPath('A').split('?')[1])).toEqual({ skuCode: 'A', quantity: 1 });
    expect(clampBuyNowQuantity(0)).toBe(CLIENT_MALL_LIMITS.QTY_MIN);
    expect(clampBuyNowQuantity('abc')).toBe(CLIENT_MALL_LIMITS.QTY_MIN);
    expect(clampBuyNowQuantity(CLIENT_MALL_LIMITS.QTY_MAX + 5)).toBe(CLIENT_MALL_LIMITS.QTY_MAX);
  });

  test('바로 구매 주소가 아니거나 상품 코드가 없으면 null', () => {
    expect(parseBuyNowQuery('')).toBeNull();
    expect(parseBuyNowQuery('?mode=buyNow')).toBeNull();
    expect(parseBuyNowQuery('?sku=A&qty=1')).toBeNull();
  });

  test('체크아웃 lines 는 그 상품 한 줄', () => {
    expect(toBuyNowCheckoutLines({ skuCode: 'A', quantity: 3 })).toEqual([{ skuCode: 'A', quantity: 3 }]);
    expect(toBuyNowCheckoutLines(null)).toBeNull();
  });
});
