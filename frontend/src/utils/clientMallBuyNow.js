/**
 * 바로 구매 — 서버 체크아웃은 장바구니 기준이므로, 기존 장바구니를 보관한 뒤
 * 그 상품 1개만 담아 결제 전 확인으로 보낸다. 결제 전 확인을 떠나거나 결제가 끝나면
 * (PAID 시 서버가 장바구니를 비움) 보관한 줄을 되돌린다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { CLIENT_MALL_BUY_NOW_STORAGE } from '../constants/clientMallConstants';

let restoreInFlight = null;

const getStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

/**
 * @param {Array<{ skuCode?: string, quantity?: number }>} lines
 * @returns {Array<{ skuCode: string, quantity: number }>}
 */
const toLinePayload = (lines) =>
  (lines || [])
    .filter((line) => line?.skuCode && Number(line.quantity) > 0)
    .map((line) => ({ skuCode: line.skuCode, quantity: Number(line.quantity) }));

/**
 * @returns {{ skuCode: string, previousLines: Array<{ skuCode: string, quantity: number }> }|null}
 */
export const readBuyNowStash = () => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const { KEY, FIELD_SKU, FIELD_LINES } = CLIENT_MALL_BUY_NOW_STORAGE;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed[FIELD_SKU]) {
      return null;
    }
    return {
      skuCode: String(parsed[FIELD_SKU]),
      previousLines: toLinePayload(parsed[FIELD_LINES])
    };
  } catch {
    return null;
  }
};

export const clearBuyNowStash = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(CLIENT_MALL_BUY_NOW_STORAGE.KEY);
  } catch {
    // 저장소 접근 불가 — 무시
  }
};

/**
 * @returns {boolean}
 */
export const hasBuyNowStash = () => readBuyNowStash() != null;

/**
 * 바로 구매 시작: 현재 장바구니를 보관하고 그 상품(기본 1개)으로 바꾼다.
 * 이미 보관 중이면(이전 바로 구매를 되돌리기 전) 처음 보관한 줄을 유지한다.
 *
 * @param {{
 *   skuCode: string,
 *   quantity?: number,
 *   fetchCart: () => Promise<{ lines?: Array<object> }>,
 *   replaceCart: (lines: Array<{ skuCode: string, quantity: number }>) => Promise<void>
 * }} deps
 * @returns {Promise<void>}
 */
export const startBuyNow = async({ skuCode, quantity = 1, fetchCart, replaceCart }) => {
  const existing = readBuyNowStash();
  let previousLines = existing ? existing.previousLines : null;
  if (!previousLines) {
    const cart = await fetchCart();
    previousLines = toLinePayload(cart?.lines);
  }
  const storage = getStorage();
  const { KEY, FIELD_SKU, FIELD_LINES } = CLIENT_MALL_BUY_NOW_STORAGE;
  if (storage) {
    try {
      storage.setItem(KEY, JSON.stringify({ [FIELD_SKU]: skuCode, [FIELD_LINES]: previousLines }));
    } catch {
      // 보관 실패 시에도 결제는 진행 — 장바구니 복원만 생략
    }
  }
  await replaceCart([{ skuCode, quantity: Math.max(1, Math.floor(Number(quantity) || 1)) }]);
};

/**
 * 보관한 장바구니를 되돌린다 (동시 호출은 한 번만 실행).
 * 실패하면 보관분을 남겨 다음 화면에서 다시 시도한다.
 *
 * @param {(lines: Array<{ skuCode: string, quantity: number }>) => Promise<void>} replaceCart
 * @returns {Promise<boolean>} 되돌렸으면 true
 */
export const restoreBuyNowCartIfNeeded = (replaceCart) => {
  if (restoreInFlight) {
    return restoreInFlight;
  }
  const stash = readBuyNowStash();
  if (!stash) {
    return Promise.resolve(false);
  }
  restoreInFlight = (async() => {
    try {
      await replaceCart(stash.previousLines);
      clearBuyNowStash();
      return true;
    } catch {
      return false;
    } finally {
      restoreInFlight = null;
    }
  })();
  return restoreInFlight;
};
