/**
 * guestShopCart + mergeCartLines / mergeGuestShopCartIntoServer 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import {
  GUEST_SHOP_CART_STORAGE_KEY,
  clearGuestShopCart,
  getGuestShopCartLines,
  mergeGuestCartLine,
  setGuestShopCartLines,
  sumCartLineQuantities
} from '../guestShopCart';
import {
  mergeCartLines,
  mergeGuestShopCartIntoServer
} from '../../services/clientShopService';
import StandardizedApi from '../standardizedApi';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

describe('guestShopCart', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('mergeGuestCartLine clamps 0–99 and persists', () => {
    expect(mergeGuestCartLine('SKU-A', 1)).toEqual([{ skuCode: 'SKU-A', quantity: 1 }]);
    expect(mergeGuestCartLine('SKU-A', 2)).toEqual([{ skuCode: 'SKU-A', quantity: 3 }]);
    expect(mergeGuestCartLine('SKU-A', 100)).toEqual([{ skuCode: 'SKU-A', quantity: 99 }]);
    expect(getGuestShopCartLines()).toEqual([{ skuCode: 'SKU-A', quantity: 99 }]);
    expect(mergeGuestCartLine('SKU-A', -99)).toEqual([]);
    expect(window.localStorage.getItem(GUEST_SHOP_CART_STORAGE_KEY)).toBeNull();
  });

  test('set/get/clear round-trip', () => {
    setGuestShopCartLines([
      { skuCode: 'A', quantity: 2 },
      { skuCode: 'B', quantity: 1 }
    ]);
    expect(getGuestShopCartLines()).toEqual([
      { skuCode: 'A', quantity: 2 },
      { skuCode: 'B', quantity: 1 }
    ]);
    clearGuestShopCart();
    expect(getGuestShopCartLines()).toEqual([]);
  });

  test('sumCartLineQuantities', () => {
    expect(sumCartLineQuantities([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
    expect(sumCartLineQuantities([])).toBe(0);
  });
});

describe('mergeCartLines / mergeGuestShopCartIntoServer', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('mergeCartLines sums by skuCode and clamps at 99', () => {
    expect(
      mergeCartLines(
        [{ skuCode: 'A', quantity: 2 }, { skuCode: 'B', quantity: 1 }],
        [{ skuCode: 'A', quantity: 3 }, { skuCode: 'C', quantity: 1 }]
      )
    ).toEqual([
      { skuCode: 'A', quantity: 5 },
      { skuCode: 'B', quantity: 1 },
      { skuCode: 'C', quantity: 1 }
    ]);
    expect(
      mergeCartLines([{ skuCode: 'A', quantity: 90 }], [{ skuCode: 'A', quantity: 20 }])
    ).toEqual([{ skuCode: 'A', quantity: 99 }]);
  });

  test('mergeGuestShopCartIntoServer replaces with merged payload then clears guest', async() => {
    setGuestShopCartLines([
      { skuCode: 'GUEST-1', quantity: 2 },
      { skuCode: 'SHARED', quantity: 1 }
    ]);
    StandardizedApi.get.mockResolvedValueOnce({
      lines: [{ skuCode: 'SHARED', quantity: 3 }],
      subtotalMinor: 0
    });
    StandardizedApi.put.mockResolvedValueOnce({ success: true });

    const result = await mergeGuestShopCartIntoServer();

    expect(StandardizedApi.put).toHaveBeenCalledWith('/api/v1/clients/me/shop/cart', {
      lines: [
        { skuCode: 'SHARED', quantity: 4 },
        { skuCode: 'GUEST-1', quantity: 2 }
      ]
    });
    expect(result.merged).toBe(true);
    expect(getGuestShopCartLines()).toEqual([]);
  });

  test('mergeGuestShopCartIntoServer is no-op when guest cart empty', async() => {
    const result = await mergeGuestShopCartIntoServer();
    expect(result).toEqual({ merged: false, lines: [] });
    expect(StandardizedApi.get).not.toHaveBeenCalled();
    expect(StandardizedApi.put).not.toHaveBeenCalled();
  });
});
