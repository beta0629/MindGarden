/**
 * 내담자 쇼핑 API 호출 (StandardizedApi)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import StandardizedApi from '../utils/standardizedApi';
import { CLIENT_SHOP_API } from '../constants/clientShopApi';
import { normalizeShopCatalogCategory } from '../constants/clientShopConstants';
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
  if (!res || !res.success) {
    throw new Error(res?.message || '체크아웃에 실패했습니다.');
  }
  return res.data;
};

export const prepareShopPayment = async(orderPublicId) => {
  const res = await StandardizedApi.post(CLIENT_SHOP_API.preparePayment(orderPublicId), {});
  if (!res || !res.success) {
    throw new Error(res?.message || '결제 준비에 실패했습니다.');
  }
  return res.data;
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
