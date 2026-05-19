/**
 * 테넌트 어드민 — 온라인 주문 API
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import StandardizedApi from '../utils/standardizedApi';
import {
  ADMIN_SHOP_API,
  ADMIN_SHOP_ORDERS_DEFAULT_LIMIT,
  buildAdminShopOrderPath,
  buildAdminShopOrderRefundPath,
  buildAdminShopRefundBody
} from '../constants/adminShopApi';

function unwrapData(raw) {
  if (raw && raw.success === true && raw.data !== undefined) {
    return raw.data;
  }
  if (raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

/**
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
export async function listAdminShopOrders(limit = ADMIN_SHOP_ORDERS_DEFAULT_LIMIT) {
  const raw = await StandardizedApi.get(ADMIN_SHOP_API.ORDERS, { limit });
  const data = unwrapData(raw);
  return Array.isArray(data) ? data : [];
}

/**
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function getAdminShopOrder(orderPublicId) {
  const raw = await StandardizedApi.get(buildAdminShopOrderPath(orderPublicId));
  return unwrapData(raw);
}

/**
 * @param {string} orderPublicId
 * @param {string} reasonCode
 * @returns {Promise<object|null>}
 */
export async function refundAdminShopOrder(orderPublicId, reasonCode) {
  const raw = await StandardizedApi.post(
    buildAdminShopOrderRefundPath(orderPublicId),
    buildAdminShopRefundBody(reasonCode)
  );
  return unwrapData(raw);
}
