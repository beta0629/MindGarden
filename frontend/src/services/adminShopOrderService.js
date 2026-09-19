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
  buildAdminShopOrderFulfillRetryPath,
  buildAdminShopOrderReconcilePaymentPath,
  buildAdminShopOrderRefundPath,
  buildAdminShopReconcilePaymentBody,
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

/**
 * PAID 주문 이행 재시도 (FAILED·retryable).
 *
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function retryAdminShopOrderFulfillment(orderPublicId) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const raw = await StandardizedApi.post(
    buildAdminShopOrderFulfillRetryPath(orderPublicId),
    {}
  );
  return unwrapData(raw);
}

/**
 * PortOne 결제 정합 — 미결제·만료 주문을 paymentId(또는 승인번호)로 복구.
 *
 * @param {string} orderPublicId
 * @param {{ paymentId?: string, cardApprovalNumber?: string }} payload
 * @returns {Promise<object|null>}
 */
export async function reconcileShopOrderPayment(orderPublicId, payload = {}) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const body = buildAdminShopReconcilePaymentBody(payload);
  if (!body.paymentId && !body.cardApprovalNumber) {
    throw new Error('paymentId 또는 cardApprovalNumber가 필요합니다.');
  }
  const raw = await StandardizedApi.post(
    buildAdminShopOrderReconcilePaymentPath(orderPublicId),
    body
  );
  return unwrapData(raw);
}

/**
 * 허용 상태 주문 soft-delete.
 *
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function deleteAdminShopOrder(orderPublicId) {
  const raw = await StandardizedApi.delete(buildAdminShopOrderPath(orderPublicId));
  return unwrapData(raw);
}
