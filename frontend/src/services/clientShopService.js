/**
 * 내담자 쇼핑 API 호출 (StandardizedApi)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import StandardizedApi from '../utils/standardizedApi';
import { CLIENT_SHOP_API } from '../constants/clientShopApi';
import { normalizeShopCatalogCategory } from '../constants/clientShopConstants';

const unwrap = (res) => (res && res.success ? res.data : null);

/**
 * @param {object} row
 * @returns {object}
 */
const mapCatalogRow = (row) => {
  if (!row || typeof row !== 'object') {
    return row;
  }
  return {
    ...row,
    catalogCategory: normalizeShopCatalogCategory(row.catalogCategory)
  };
};

export const fetchShopCatalog = async () => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.CATALOG);
  const data = unwrap(res);
  return Array.isArray(data) ? data.map(mapCatalogRow) : [];
};

export const fetchShopCart = async () => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.CART);
  return unwrap(res) || { lines: [], subtotalMinor: 0 };
};

export const replaceShopCart = async (lines) => {
  const res = await StandardizedApi.put(CLIENT_SHOP_API.CART, { lines });
  if (!res || !res.success) {
    throw new Error(res?.message || '장바구니 갱신에 실패했습니다.');
  }
};

export const fetchPointBalance = async () => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.POINTS_BALANCE);
  return unwrap(res) || { availableMinor: 0, heldMinor: 0 };
};

export const fetchPointLedger = async (limit = 20) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.POINTS_LEDGER, { limit });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchShopOrders = async (page = 0, size = 10) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.ORDERS, { page, size });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/**
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export const fetchShopOrder = async (orderPublicId) => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.orderDetail(orderPublicId));
  return unwrap(res);
};

/**
 * 카탈로그에서 SKU 1건 조회 (PDP — 별도 단건 API 없음).
 *
 * @param {string} skuCode
 * @returns {Promise<object|null>}
 */
export const fetchShopCatalogSku = async (skuCode) => {
  const catalog = await fetchShopCatalog();
  return catalog.find((row) => row.skuCode === skuCode) || null;
};

export const fetchConsultantMappings = async () => {
  const res = await StandardizedApi.get(CLIENT_SHOP_API.CONSULTANT_MAPPINGS);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/**
 * @param {string} idempotencyKey
 * @param {number} pointsToRedeemMinor
 * @param {number|null|undefined} consultantClientMappingId
 */
export const postShopCheckout = async (
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

export const prepareShopPayment = async (orderPublicId) => {
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
