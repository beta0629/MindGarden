/**
 * 테넌트 어드민 — 쇼핑·리워드 API·라우트 상수 (P2-admin)
 *
 * @see docs/project-management/SHOP_REWARD_PLATFORM_ORCHESTRATION.md
 * @author CoreSolution
 * @since 2026-05-19
 */

import { ADMIN_ROUTES } from './adminRoutes';

/** @type {Readonly<{ CATALOG_SKUS: string, POINT_POLICIES: string, ORDERS: string }>} */
export const ADMIN_SHOP_API = {
  CATALOG_SKUS: '/api/v1/admin/shop/catalog-skus',
  POINT_POLICIES: '/api/v1/admin/shop/point-policies',
  ORDERS: '/api/v1/admin/shop/orders'
};

export const ADMIN_SHOP_ROUTES = {
  CATALOG_SKUS: ADMIN_ROUTES.SHOP_CATALOG_SKUS,
  POINT_POLICIES: ADMIN_ROUTES.SHOP_POINT_POLICIES,
  ORDERS: ADMIN_ROUTES.SHOP_ORDERS
};

/** 어드민 전액 환불 사유 코드 (백엔드 ShopRefundConstants와 동일) */
export const ADMIN_SHOP_REFUND_REASON_CODES = {
  CUSTOMER_REQUEST: 'CUSTOMER_REQUEST',
  ADMIN_ERROR: 'ADMIN_ERROR',
  PRE_FULFILLMENT: 'PRE_FULFILLMENT'
};

/** @type {ReadonlyArray<{ value: string, label: string }>} */
export const ADMIN_SHOP_REFUND_REASON_OPTIONS = [
  { value: ADMIN_SHOP_REFUND_REASON_CODES.CUSTOMER_REQUEST, label: '고객 요청' },
  { value: ADMIN_SHOP_REFUND_REASON_CODES.ADMIN_ERROR, label: '운영 오류' },
  { value: ADMIN_SHOP_REFUND_REASON_CODES.PRE_FULFILLMENT, label: '이행 전 취소' }
];

/** API ShopClientOrderStatus → 어드민 UI 라벨 */
export const ADMIN_SHOP_ORDER_STATUS_LABELS = {
  CREATED: '생성',
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
  EXPIRED: '만료',
  REFUNDED: '환불 완료'
};

/**
 * soft-delete 허용 상태 (백엔드 ShopAdminOrderConstants.DELETABLE_STATUSES 와 동일).
 * PAID·환불 진행 중은 서버에서 거부.
 * @type {ReadonlyArray<string>}
 */
export const ADMIN_SHOP_ORDER_DELETABLE_STATUSES = Object.freeze([
  'CREATED',
  'PENDING_PAYMENT',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED'
]);

/** 목록 기본 조회 건수 (백엔드 ShopAdminOrderConstants.DEFAULT_LIST_LIMIT) */
export const ADMIN_SHOP_ORDERS_DEFAULT_LIMIT = 50;

/** 어드민 주문 상세·환불 — paymentId / PG 안내 카피 */
export const ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL = '결제 ID';
export const ADMIN_SHOP_ORDER_PAYMENT_STATUS_LABEL = '결제 상태';
export const ADMIN_SHOP_REFUND_PG_HINT =
  '전액 환불 시 PortOne(또는 PG) 결제 취소·회기 원복·포인트 원장·주문 REFUNDED가 함께 반영됩니다.';
export const ADMIN_SHOP_ORDER_LINE_SESSION_LABEL = '회기';

/** SKU 가격 이력 기본 조회 건수 */
export const ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT = 50;

/**
 * @param {string|number} skuId
 * @returns {string}
 */
export function buildAdminShopCatalogSkuPath(skuId) {
  return `${ADMIN_SHOP_API.CATALOG_SKUS}/${encodeURIComponent(String(skuId))}`;
}

/**
 * @param {string|number} skuId
 * @returns {string}
 */
export function buildAdminShopCatalogSkuThumbnailPath(skuId) {
  return `${buildAdminShopCatalogSkuPath(skuId)}/thumbnail`;
}

/**
 * @returns {string}
 */
export function buildAdminShopCatalogSkuNewRoute() {
  return `${ADMIN_SHOP_ROUTES.CATALOG_SKUS}/new`;
}

/**
 * @param {string|number} skuId
 * @returns {string}
 */
export function buildAdminShopCatalogSkuEditRoute(skuId) {
  return `${ADMIN_SHOP_ROUTES.CATALOG_SKUS}/${encodeURIComponent(String(skuId))}/edit`;
}

/**
 * @param {string|number} skuId
 * @returns {string}
 */
export function buildAdminShopCatalogVisiblePath(skuId) {
  return `${buildAdminShopCatalogSkuPath(skuId)}/catalog-visible`;
}

/**
 * @param {string|number} skuId
 * @param {number} [limit]
 * @returns {string}
 */
export function buildAdminShopCatalogPriceHistoryPath(
  skuId,
  limit = ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT
) {
  const base = `${buildAdminShopCatalogSkuPath(skuId)}/price-history`;
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT;
  return `${base}?limit=${encodeURIComponent(String(safeLimit))}`;
}

/**
 * @param {boolean} catalogVisible
 * @returns {Readonly<{ catalogVisible: boolean }>}
 */
export function buildCatalogVisiblePatchBody(catalogVisible) {
  return { catalogVisible: Boolean(catalogVisible) };
}

/**
 * @param {string} orderPublicId
 * @returns {string}
 */
export function buildAdminShopOrderPath(orderPublicId) {
  return `${ADMIN_SHOP_API.ORDERS}/${encodeURIComponent(String(orderPublicId))}`;
}

/**
 * @param {string} orderPublicId
 * @returns {string}
 */
export function buildAdminShopOrderRefundPath(orderPublicId) {
  return `${buildAdminShopOrderPath(orderPublicId)}/refund`;
}

/**
 * @param {string} status
 * @param {boolean} [deletableFromApi]
 * @returns {boolean}
 */
export function isAdminShopOrderDeletable(status, deletableFromApi) {
  if (typeof deletableFromApi === 'boolean') {
    return deletableFromApi;
  }
  const key = status != null ? String(status) : '';
  return ADMIN_SHOP_ORDER_DELETABLE_STATUSES.includes(key);
}

/**
 * @param {string} reasonCode
 * @returns {Readonly<{ reasonCode: string }>}
 */
export function buildAdminShopRefundBody(reasonCode) {
  return { reasonCode: String(reasonCode) };
}
