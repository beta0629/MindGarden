/**
 * 내담자 쇼핑 API 호출 (StandardizedApi)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import StandardizedApi from '../utils/standardizedApi';
import { CLIENT_SHOP_API } from '../constants/clientShopApi';
import {
  normalizeShopCatalogCategory,
  SHOP_CHECKOUT_ERROR_COPY
} from '../constants/clientShopConstants';
import { ensurePublicShopTenantContext } from '../utils/ensurePublicShopTenantContext';
import {
  clearGuestShopCart,
  getGuestShopCartLines
} from '../utils/guestShopCart';
import { toDisplayString } from '../utils/safeDisplay';

/**
 * StandardizedApi(apiGet)는 기본적으로 ApiResponse.data를 추출해 반환한다.
 * 배열·도메인 객체가 직접 오는 경우와 { success, data } 래퍼가 남는 경우를 모두 처리한다.
 *
 * @param {*} res
 * @returns {*|null}
 */
const unwrap = (res) => {
  if (res == null) {
    return null;
  }
  if (Array.isArray(res)) {
    return res;
  }
  if (typeof res !== 'object') {
    return null;
  }
  if ('success' in res) {
    return res.success ? res.data ?? null : null;
  }
  return res;
};

/**
 * @param {object} row
 * @returns {object}
 */
const mapCatalogRow = (row) => {
  if (!row || typeof row !== 'object') {
    return row;
  }
  const thumbnailUrl = toDisplayString(
    row.thumbnailUrl || row.heroImageUrl,
    ''
  );
  return {
    ...row,
    catalogCategory: normalizeShopCatalogCategory(row.catalogCategory),
    thumbnailUrl: thumbnailUrl || null
  };
};

/**
 * 공개 카탈로그 목록 (로그인 불필요).
 *
 * @returns {Promise<object[]>}
 */
export const fetchShopCatalog = async() => {
  await ensurePublicShopTenantContext();
  const res = await StandardizedApi.get(CLIENT_SHOP_API.PUBLIC_CATALOG);
  const data = unwrap(res);
  return Array.isArray(data) ? data.map(mapCatalogRow) : [];
};

export const fetchShopCart = async() => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.CART);
  return unwrap(res) || { lines: [], subtotalMinor: 0 };
};

export const replaceShopCart = async(lines) => {
  const res = await StandardizedApi.put(CLIENT_SHOP_API.CART, { lines });
  if (!res || !res.success) {
    throw new Error(res?.message || '장바구니 갱신에 실패했습니다.');
  }
};

export const fetchPointBalance = async() => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.POINTS_BALANCE);
  return unwrap(res) || { availableMinor: 0, heldMinor: 0 };
};

export const fetchPointLedger = async(limit = 20) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.POINTS_LEDGER, { limit });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchShopOrders = async(page = 0, size = 10) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.ORDERS, { page, size });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/**
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export const fetchShopOrder = async(orderPublicId) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.orderDetail(orderPublicId));
  return unwrap(res);
};

/**
 * 공개 카탈로그에서 SKU 1건 조회 (PDP).
 *
 * @param {string} skuCode
 * @returns {Promise<object|null>}
 */
export const fetchShopCatalogSku = async(skuCode) => {
  if (!skuCode) {
    return null;
  }
  await ensurePublicShopTenantContext();
  const res = await StandardizedApi.get(CLIENT_SHOP_API.publicCatalogSku(skuCode));
  const data = unwrap(res);
  return data ? mapCatalogRow(data) : null;
};

export const fetchConsultantMappings = async() => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.CONSULTANT_MAPPINGS);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/**
 * 실패 엔벨로프에서 비어 있지 않은 message를 꺼낸다.
 *
 * @param {*} res
 * @param {string} fallback
 * @returns {string}
 */
const failureMessage = (res, fallback) => {
  if (
    res
    && typeof res === 'object'
    && res.success === false
    && typeof res.message === 'string'
    && res.message.trim()
  ) {
    return res.message;
  }
  return fallback;
};

/**
 * @param {string} idempotencyKey
 * @param {number} pointsToRedeemMinor
 * @param {number|null|undefined} consultantClientMappingId
 */
export const postShopCheckout = async(
  idempotencyKey,
  pointsToRedeemMinor,
  consultantClientMappingId
) => {
  const body = {
    idempotencyKey,
    pointsToRedeemMinor
  };
  if (consultantClientMappingId != null && consultantClientMappingId !== '') {
    body.consultantClientMappingId = Number(consultantClientMappingId);
  }
  const res = await StandardizedApi.post(CLIENT_SHOP_API.CHECKOUT, body);
  const data = unwrap(res);
  if (data == null || !data.orderPublicId) {
    throw new Error(failureMessage(res, '체크아웃에 실패했습니다.'));
  }
  return data;
};

export const prepareShopPayment = async(orderPublicId) => {
  const res = await StandardizedApi.post(CLIENT_SHOP_API.preparePayment(orderPublicId), {});
  const data = unwrap(res);
  if (
    data == null
    || !data.paymentId
    || !data.storeId
    || !data.channelKey
  ) {
    throw new Error(failureMessage(res, SHOP_CHECKOUT_ERROR_COPY.PREPARE_FAILED));
  }
  return data;
};

/**
 * PortOne SDK 성공 후 BE 결제 검증 (fail-closed: null / isValid !== true).
 *
 * @param {string} paymentId
 * @param {number} amount prepare에서 검증된 cashAmount
 * @returns {Promise<{ isValid: boolean, message?: string }>}
 */
export const verifyShopPayment = async(paymentId, amount) => {
  if (!paymentId || !String(paymentId).trim()) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
  }
  if (amount == null || typeof amount === 'object' || !Number.isFinite(Number(amount))) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const res = await StandardizedApi.post(
    CLIENT_SHOP_API.verifyPayment(String(paymentId).trim(), Number(amount)),
    {}
  );
  if (res == null) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.SESSION_EXPIRED);
  }
  if (typeof res === 'object' && 'success' in res && res.success === false) {
    throw new Error(res.message || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
  }
  const data = unwrap(res);
  if (!data || data.isValid !== true) {
    const msg =
      data && typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED;
    throw new Error(msg);
  }
  return data;
};

/**
 * 결제 전 주문 취소 (CREATED / PENDING_PAYMENT).
 * PortOne 미기동 시 고아 미결제 주문 정리용.
 * Void 성공 시 data가 null이어도 엔벨로프 success 또는 unwrap(null)을 성공으로 본다.
 *
 * @param {string} orderPublicId
 * @returns {Promise<*>}
 */
export const cancelShopOrder = async(orderPublicId) => {
  if (!orderPublicId) {
    throw new Error('주문 번호가 없습니다.');
  }
  const res = await StandardizedApi.post(CLIENT_SHOP_API.cancelOrder(orderPublicId), {});
  if (res && typeof res === 'object' && 'success' in res && res.success === false) {
    throw new Error(failureMessage(res, '주문 취소에 실패했습니다.'));
  }
  return unwrap(res);
};

/**
 * PAID 주문 이행 재시도 (FAILED·retryable). 내담자: 성공 재이행 1회 소진(서버 플래그).
 * Anti double-tap 은 FE retrying + preventDoubleClick. FAILED+retryable 이면 버튼 재노출.
 *
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export const retryShopOrderFulfillment = async(orderPublicId) => {
  if (!orderPublicId) {
    throw new Error('주문 번호가 없습니다.');
  }
  const res = await StandardizedApi.post(CLIENT_SHOP_API.fulfillRetry(orderPublicId), {});
  if (res && typeof res === 'object' && 'success' in res && res.success === false) {
    throw new Error(failureMessage(res, '재이행에 실패했습니다.'));
  }
  return unwrap(res);
};

export const buildCartLinesPayload = (lines) =>
  (lines || []).map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity
  }));

/**
 * 두 장바구니 라인을 skuCode 기준 합산(수량 0–99).
 *
 * @param {{ skuCode: string, quantity: number }[]} a
 * @param {{ skuCode: string, quantity: number }[]} b
 * @returns {{ skuCode: string, quantity: number }[]}
 */
export const mergeCartLines = (a, b) => {
  const next = (a || []).map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity
  }));
  (b || []).forEach((line) => {
    if (!line?.skuCode) {
      return;
    }
    const idx = next.findIndex((l) => l.skuCode === line.skuCode);
    const addQty = Number(line.quantity);
    if (!Number.isFinite(addQty) || addQty <= 0) {
      return;
    }
    if (idx >= 0) {
      next[idx] = {
        skuCode: line.skuCode,
        quantity: Math.min(99, next[idx].quantity + Math.floor(addQty))
      };
    } else {
      next.push({
        skuCode: line.skuCode,
        quantity: Math.min(99, Math.floor(addQty))
      });
    }
  });
  return next.filter((l) => l.quantity > 0);
};

export const mergeCartLine = (currentLines, skuCode, delta) => {
  const next = (currentLines || []).map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity
  }));
  const idx = next.findIndex((l) => l.skuCode === skuCode);
  if (idx >= 0) {
    const qty = Math.max(0, Math.min(99, next[idx].quantity + delta));
    if (qty === 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = { skuCode, quantity: qty };
    }
  } else if (delta > 0) {
    next.push({ skuCode, quantity: Math.min(99, delta) });
  }
  return next;
};

/**
 * 게스트 localStorage 카트를 서버 카트에 합친 뒤 게스트 저장소를 비운다(멱등).
 *
 * @returns {Promise<{ merged: boolean, lines: { skuCode: string, quantity: number }[] }>}
 */
export const mergeGuestShopCartIntoServer = async() => {
  const guestLines = getGuestShopCartLines();
  if (!guestLines.length) {
    return { merged: false, lines: [] };
  }
  const cart = await fetchShopCart();
  const merged = mergeCartLines(cart.lines, guestLines);
  await replaceShopCart(merged);
  clearGuestShopCart();
  return { merged: true, lines: merged };
};
