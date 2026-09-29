/**
 * clientMallBuyNow — 바로 구매 장바구니 보관·복원
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  clearBuyNowStash,
  hasBuyNowStash,
  readBuyNowStash,
  restoreBuyNowCartIfNeeded,
  startBuyNow
} from '../clientMallBuyNow';

describe('clientMallBuyNow', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test('시작: 현재 장바구니 보관 → 그 상품만 담음', async() => {
    const replaceCart = jest.fn().mockResolvedValue();
    await startBuyNow({
      skuCode: 'A',
      fetchCart: async() => ({ lines: [{ skuCode: 'B', quantity: 2, title: 'x' }] }),
      replaceCart
    });
    expect(replaceCart).toHaveBeenCalledWith([{ skuCode: 'A', quantity: 1 }]);
    expect(readBuyNowStash().previousLines).toEqual([{ skuCode: 'B', quantity: 2 }]);
  });

  test('이미 보관 중이면 처음 보관분 유지', async() => {
    const replaceCart = jest.fn().mockResolvedValue();
    await startBuyNow({ skuCode: 'A', fetchCart: async() => ({ lines: [{ skuCode: 'B', quantity: 1 }] }), replaceCart });
    const fetchCart = jest.fn();
    await startBuyNow({ skuCode: 'C', quantity: 2, fetchCart, replaceCart });
    expect(fetchCart).not.toHaveBeenCalled();
    expect(replaceCart).toHaveBeenLastCalledWith([{ skuCode: 'C', quantity: 2 }]);
    expect(readBuyNowStash().previousLines).toEqual([{ skuCode: 'B', quantity: 1 }]);
  });

  test('복원: 보관분으로 되돌리고 비움 · 실패 시 유지', async() => {
    const replaceCart = jest.fn().mockResolvedValue();
    await startBuyNow({ skuCode: 'A', fetchCart: async() => ({ lines: [{ skuCode: 'B', quantity: 1 }] }), replaceCart });

    const failing = jest.fn().mockRejectedValue(new Error('x'));
    await expect(restoreBuyNowCartIfNeeded(failing)).resolves.toBe(false);
    expect(hasBuyNowStash()).toBe(true);

    const ok = jest.fn().mockResolvedValue();
    await expect(restoreBuyNowCartIfNeeded(ok)).resolves.toBe(true);
    expect(ok).toHaveBeenCalledWith([{ skuCode: 'B', quantity: 1 }]);
    expect(hasBuyNowStash()).toBe(false);
  });

  test('보관분 없으면 아무것도 안 함', async() => {
    clearBuyNowStash();
    const replaceCart = jest.fn();
    await expect(restoreBuyNowCartIfNeeded(replaceCart)).resolves.toBe(false);
    expect(replaceCart).not.toHaveBeenCalled();
  });
});
