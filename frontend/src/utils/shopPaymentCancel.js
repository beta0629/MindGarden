/**
 * 결제창 사용자 취소 vs 결제 실패 판정 · 취소 후 돌아갈 화면 · 재결제 멱등 키.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  buildShopSkuDetailPath,
  CLIENT_SHOP_ROUTES,
  PORTONE_USER_CANCEL_CODE,
  SHOP_PAYMENT_CANCEL_NOTICE_STATE_KEY,
  SHOP_USER_CANCEL_OUTCOME
} from '../constants/clientShopConstants';
import { CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW } from '../constants/clientMallConstants';

const trimmedOrNull = (value) => {
  if (value == null || typeof value === 'object') {
    return null;
  }
  const s = String(value).trim();
  return s || null;
};

const USER_CANCEL_MESSAGE_TOKEN = `[${PORTONE_USER_CANCEL_CODE}]`;

/**
 * PortOne 응답(SDK 반환 또는 redirect 쿼리)이 사용자가 결제창을 닫은 경우인지.
 * code 유무만으로 판단하지 않는다 — PAY_PROCESS_CANCELED 만 취소, 나머지(카드 거절 등)는 실패.
 *
 * @param {{ code?: string|null, pgCode?: string|null, message?: string|null }|null|undefined} result
 * @returns {boolean}
 */
export const isPortOneUserCancel = (result) => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const code = trimmedOrNull(result.code);
  const pgCode = trimmedOrNull(result.pgCode);
  const message = trimmedOrNull(result.message) || '';
  return code === PORTONE_USER_CANCEL_CODE
    || pgCode === PORTONE_USER_CANCEL_CODE
    || message.includes(USER_CANCEL_MESSAGE_TOKEN);
};

/**
 * PortOne 실패 응답에서 사용자에게 보여줄 사유 ( [CODE] 접두어 제거 ).
 *
 * @param {{ message?: string|null, pgMessage?: string|null }|null|undefined} result
 * @param {string} fallback
 * @returns {string}
 */
export const resolvePortOneFailureReason = (result, fallback) => {
  const raw = trimmedOrNull(result?.pgMessage) || trimmedOrNull(result?.message);
  if (!raw) {
    return fallback;
  }
  const withoutCode = raw.replace(/^\[[^\]]*\]\s*/, '').trim();
  return withoutCode || fallback;
};

/**
 * 취소 후 돌아갈 화면. 장바구니 경유 → 장바구니, 바로 구매 → 그 상품 상세 (SKU 모르면 목록).
 *
 * @param {{ checkoutSource?: string|null, skuCode?: string|null, skuCodes?: string[]|null }} params
 * @returns {string}
 */
export const resolveShopPaymentCancelDestination = ({ checkoutSource, skuCode, skuCodes } = {}) => {
  if (checkoutSource !== CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW) {
    return CLIENT_SHOP_ROUTES.CART;
  }
  const sku = trimmedOrNull(skuCode)
    || (Array.isArray(skuCodes) ? skuCodes.map(trimmedOrNull).find(Boolean) : null);
  return sku ? buildShopSkuDetailPath(sku) : CLIENT_SHOP_ROUTES.CATALOG;
};

/**
 * 취소 후 이동 시 router state — 도착 화면이 amber 안내를 한 번 띄운다.
 *
 * @returns {{ [key: string]: true }}
 */
export const buildShopPaymentCancelNavigationState = () => ({
  [SHOP_PAYMENT_CANCEL_NOTICE_STATE_KEY]: true
});

/**
 * @param {*} state location.state
 * @returns {boolean}
 */
export const hasShopPaymentCancelNotice = (state) =>
  Boolean(state && typeof state === 'object' && state[SHOP_PAYMENT_CANCEL_NOTICE_STATE_KEY] === true);

/**
 * redirect 복귀(ShopPaymentReturnPage)에서 사용자 취소 정리.
 * 서버가 PortOne PAID 를 확인하면 정상 결제 확인으로, 아니면 들어온 화면 경로를 돌려준다.
 * 서버 정리가 실패해도 복귀는 한다 (주문 상세로 출처 추정, 그것도 실패하면 장바구니).
 *
 * @param {{
 *   orderPublicId: string|null,
 *   cancelShopPaymentByUser: (orderPublicId: string) => Promise<object>,
 *   fetchShopOrder: (orderPublicId: string) => Promise<object|null>
 * }} deps
 * @returns {Promise<{ paidPaymentId: string }|{ destination: string }>}
 */
export const settleShopPaymentReturnCancel = async({ orderPublicId, cancelShopPaymentByUser, fetchShopOrder }) => {
  if (!orderPublicId) {
    return { destination: CLIENT_SHOP_ROUTES.CART };
  }
  try {
    const result = await cancelShopPaymentByUser(orderPublicId);
    if (result?.outcome === SHOP_USER_CANCEL_OUTCOME.PAID && trimmedOrNull(result.paymentId)) {
      return { paidPaymentId: trimmedOrNull(result.paymentId) };
    }
    return { destination: resolveShopPaymentCancelDestination(result || {}) };
  } catch (e) {
    console.warn('결제창 취소 후 주문 정리 실패:', orderPublicId, e);
  }
  try {
    const order = await fetchShopOrder(orderPublicId);
    const skuCodes = Array.isArray(order?.lines) ? order.lines.map((l) => l?.skuCode) : [];
    return { destination: resolveShopPaymentCancelDestination({ checkoutSource: order?.checkoutSource, skuCodes }) };
  } catch {
    return { destination: CLIENT_SHOP_ROUTES.CART };
  }
};

const createRandomKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * 체크아웃 내용 서명 — 같은 장바구니 내용 / 같은 바로 구매 상품이면 같은 값.
 *
 * @param {{ isBuyNow: boolean, lines: Array<{ skuCode: string, quantity: number }>,
 *   pointsRedeemMinor: number, mappingId?: string|number|null }} params
 * @returns {string}
 */
export const buildShopCheckoutSignature = ({ isBuyNow, lines, pointsRedeemMinor, mappingId }) => {
  const normalized = (lines || [])
    .map((l) => `${l.skuCode}:${Number(l.quantity) || 0}`)
    .sort();
  return JSON.stringify([
    isBuyNow ? CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW : '',
    normalized,
    Number(pointsRedeemMinor) || 0,
    mappingId == null || mappingId === '' ? '' : String(mappingId)
  ]);
};

/**
 * 재결제 멱등 키 저장소. 같은 서명이면 같은 키(서버가 기존 주문 반환),
 * 내용이 바뀌거나 서버가 주문을 취소한 뒤(reset)에만 새 키를 만든다.
 *
 * @param {() => string} [createKey]
 * @returns {{ keyFor: (signature: string) => string, reset: () => void }}
 */
export const createShopCheckoutIdempotencyKeyStore = (createKey = createRandomKey) => {
  let current = null;
  return {
    keyFor: (signature) => {
      if (!current || current.signature !== signature) {
        current = { signature, key: createKey() };
      }
      return current.key;
    },
    reset: () => {
      current = null;
    }
  };
};
