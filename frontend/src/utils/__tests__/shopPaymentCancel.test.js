/**
 * shopPaymentCancel — 사용자 취소 판정 · 실패 사유 · 복귀 경로 · 재결제 멱등 키
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  buildShopSkuDetailPath,
  CLIENT_SHOP_ROUTES,
  PORTONE_USER_CANCEL_CODE,
  SHOP_USER_CANCEL_OUTCOME
} from '../../constants/clientShopConstants';
import {
  buildShopCheckoutSignature,
  buildShopPaymentCancelNavigationState,
  createShopCheckoutIdempotencyKeyStore,
  hasShopPaymentCancelNotice,
  isPortOneUserCancel,
  resolvePortOneFailureReason,
  resolveShopPaymentCancelDestination,
  settleShopPaymentReturnCancel
} from '../shopPaymentCancel';

describe('isPortOneUserCancel', () => {
  test('PAY_PROCESS_CANCELED 만 취소 (code · pgCode · 메시지 토큰)', () => {
    expect(isPortOneUserCancel({ code: PORTONE_USER_CANCEL_CODE })).toBe(true);
    expect(isPortOneUserCancel({ code: 'FAILURE_TYPE_PG', pgCode: PORTONE_USER_CANCEL_CODE })).toBe(true);
    expect(isPortOneUserCancel({ code: 'X', message: `[${PORTONE_USER_CANCEL_CODE}] 사용자가 취소` })).toBe(true);
  });

  test('카드 거절 등은 취소 아님', () => {
    expect(isPortOneUserCancel({ code: 'FAILURE_TYPE_PG', message: '[PG_DECLINED] 한도 초과' })).toBe(false);
    expect(isPortOneUserCancel({ code: 'PAY_PROCESS_ABORTED' })).toBe(false);
    expect(isPortOneUserCancel(null)).toBe(false);
    expect(isPortOneUserCancel({})).toBe(false);
  });
});

describe('resolvePortOneFailureReason', () => {
  test('pgMessage 우선 · [CODE] 접두어 제거 · 없으면 fallback', () => {
    expect(resolvePortOneFailureReason({ pgMessage: '잔액 부족', message: 'x' }, 'fb')).toBe('잔액 부족');
    expect(resolvePortOneFailureReason({ message: '[PG_DECLINED] 한도 초과' }, 'fb')).toBe('한도 초과');
    expect(resolvePortOneFailureReason({ message: '[PG_DECLINED]' }, 'fb')).toBe('fb');
    expect(resolvePortOneFailureReason(null, 'fb')).toBe('fb');
  });
});

describe('resolveShopPaymentCancelDestination', () => {
  test('장바구니 경유 → 장바구니', () => {
    expect(resolveShopPaymentCancelDestination({ checkoutSource: 'CART', skuCodes: ['A'] })).toBe(CLIENT_SHOP_ROUTES.CART);
    expect(resolveShopPaymentCancelDestination({})).toBe(CLIENT_SHOP_ROUTES.CART);
  });

  test('바로 구매 → 그 상품 상세, SKU 모르면 목록', () => {
    expect(resolveShopPaymentCancelDestination({ checkoutSource: 'BUY_NOW', skuCode: 'PKG10' }))
      .toBe(buildShopSkuDetailPath('PKG10'));
    expect(resolveShopPaymentCancelDestination({ checkoutSource: 'BUY_NOW', skuCodes: [' ', 'ONE'] }))
      .toBe(buildShopSkuDetailPath('ONE'));
    expect(resolveShopPaymentCancelDestination({ checkoutSource: 'BUY_NOW' })).toBe(CLIENT_SHOP_ROUTES.CATALOG);
  });
});

describe('cancel notice state', () => {
  test('buildShopPaymentCancelNavigationState ↔ hasShopPaymentCancelNotice', () => {
    expect(hasShopPaymentCancelNotice(buildShopPaymentCancelNavigationState())).toBe(true);
    expect(hasShopPaymentCancelNotice(null)).toBe(false);
    expect(hasShopPaymentCancelNotice({ other: true })).toBe(false);
  });
});

describe('재결제 멱등 키', () => {
  test('같은 내용이면 같은 키 · 내용 바뀌거나 reset 후에만 새 키', () => {
    let n = 0;
    const store = createShopCheckoutIdempotencyKeyStore(() => `k${++n}`);
    const cart = buildShopCheckoutSignature({
      isBuyNow: false, lines: [{ skuCode: 'B', quantity: 1 }, { skuCode: 'A', quantity: 2 }], pointsRedeemMinor: 0
    });
    const sameCartReordered = buildShopCheckoutSignature({
      isBuyNow: false, lines: [{ skuCode: 'A', quantity: 2 }, { skuCode: 'B', quantity: 1 }], pointsRedeemMinor: 0
    });
    const changed = buildShopCheckoutSignature({
      isBuyNow: false, lines: [{ skuCode: 'A', quantity: 3 }, { skuCode: 'B', quantity: 1 }], pointsRedeemMinor: 0
    });
    const buyNow = buildShopCheckoutSignature({
      isBuyNow: true, lines: [{ skuCode: 'A', quantity: 2 }, { skuCode: 'B', quantity: 1 }], pointsRedeemMinor: 0
    });

    expect(store.keyFor(cart)).toBe('k1');
    expect(store.keyFor(sameCartReordered)).toBe('k1');
    expect(store.keyFor(changed)).toBe('k2');
    expect(store.keyFor(buyNow)).toBe('k3');
    store.reset();
    expect(store.keyFor(buyNow)).toBe('k4');
  });
});

describe('settleShopPaymentReturnCancel', () => {
  test('취소됨 → 응답 출처로 복귀 경로', async() => {
    const cancel = jest.fn().mockResolvedValue({
      outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED, checkoutSource: 'BUY_NOW', skuCodes: ['PKG10']
    });
    await expect(settleShopPaymentReturnCancel({ orderPublicId: 'o1', cancelShopPaymentByUser: cancel, fetchShopOrder: jest.fn() }))
      .resolves.toEqual({ destination: buildShopSkuDetailPath('PKG10') });
  });

  test('PortOne 결제 진행 중(주문 PENDING 유지) → 닫힌 경우와 같은 출처로 복귀', async() => {
    const cancel = jest.fn().mockResolvedValue({
      outcome: SHOP_USER_CANCEL_OUTCOME.NOT_CANCELLABLE_IN_PROGRESS, orderStatus: 'PENDING_PAYMENT',
      checkoutSource: 'CART', skuCodes: ['PKG10']
    });
    await expect(settleShopPaymentReturnCancel({ orderPublicId: 'o1', cancelShopPaymentByUser: cancel, fetchShopOrder: jest.fn() }))
      .resolves.toEqual({ destination: CLIENT_SHOP_ROUTES.CART });
  });

  test('PortOne PAID → paidPaymentId', async() => {
    const cancel = jest.fn().mockResolvedValue({ outcome: SHOP_USER_CANCEL_OUTCOME.PAID, paymentId: 'pay-9' });
    await expect(settleShopPaymentReturnCancel({ orderPublicId: 'o1', cancelShopPaymentByUser: cancel, fetchShopOrder: jest.fn() }))
      .resolves.toEqual({ paidPaymentId: 'pay-9' });
  });

  test('취소 API 실패 → 주문 조회로 출처 추정 · 그것도 실패하면 장바구니', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const cancel = jest.fn().mockRejectedValue(new Error('x'));
    const fetchOrder = jest.fn().mockResolvedValue({ checkoutSource: 'BUY_NOW', lines: [{ skuCode: 'ONE' }] });
    await expect(settleShopPaymentReturnCancel({ orderPublicId: 'o1', cancelShopPaymentByUser: cancel, fetchShopOrder: fetchOrder }))
      .resolves.toEqual({ destination: buildShopSkuDetailPath('ONE') });

    const fetchFail = jest.fn().mockRejectedValue(new Error('y'));
    await expect(settleShopPaymentReturnCancel({ orderPublicId: 'o1', cancelShopPaymentByUser: cancel, fetchShopOrder: fetchFail }))
      .resolves.toEqual({ destination: CLIENT_SHOP_ROUTES.CART });
    warn.mockRestore();
  });

  test('주문 ID 없으면 장바구니', async() => {
    const cancel = jest.fn();
    await expect(settleShopPaymentReturnCancel({ orderPublicId: null, cancelShopPaymentByUser: cancel, fetchShopOrder: jest.fn() }))
      .resolves.toEqual({ destination: CLIENT_SHOP_ROUTES.CART });
    expect(cancel).not.toHaveBeenCalled();
  });
});
