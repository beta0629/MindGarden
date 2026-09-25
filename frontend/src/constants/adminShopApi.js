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

/** Clinic ShopClientOrderStatus.PAID — primary refund CTA gate */
export const ADMIN_SHOP_ORDER_STATUS_PAID = 'PAID';

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
 * PortOne live statuses that mean already cancelled (mirrors
 * PortOneV2PaymentVerifyService.STATUS_CANCELLED / STATUS_PARTIAL_CANCELLED).
 * @type {ReadonlyArray<string>}
 */
export const ADMIN_SHOP_PG_CANCELLED_STATUSES = Object.freeze([
  'CANCELLED',
  'PARTIAL_CANCELLED'
]);

/**
 * @param {string|null|undefined} pgStatus
 * @returns {boolean}
 */
export function isAdminShopPgCancelled(pgStatus) {
  if (pgStatus == null || pgStatus === '') {
    return false;
  }
  const normalized = String(pgStatus).trim().toUpperCase();
  return ADMIN_SHOP_PG_CANCELLED_STATUSES.includes(normalized);
}

/**
 * Primary refund CTA gate: Clinic PAID and PortOne not already cancelled.
 * Unknown/null pgStatus keeps primary CTA (reconcile still available).
 *
 * @param {object|null|undefined} detail
 * @returns {boolean}
 */
export function canAdminShopOrderPrimaryRefund(detail) {
  if (detail == null || typeof detail !== 'object') {
    return false;
  }
  if (detail.status !== ADMIN_SHOP_ORDER_STATUS_PAID) {
    return false;
  }
  return !isAdminShopPgCancelled(detail.pgStatus);
}

/**
 * soft-delete 허용 상태 (백엔드 ShopAdminOrderConstants.DELETABLE_STATUSES 와 동일).
 * PAID·라이브/in-flight 결제(PENDING/PROCESSING/APPROVED)는 서버 deletable 플래그로 거부.
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

/** 목록 기본 페이지 (0-based, adminListFetch 정합) */
export const ADMIN_SHOP_ORDERS_DEFAULT_PAGE = 0;

/** 목록 기본 페이지 크기 — DEFAULT_LIMIT 과 동일 */
export const ADMIN_SHOP_ORDERS_DEFAULT_PAGE_SIZE = ADMIN_SHOP_ORDERS_DEFAULT_LIMIT;

/** 어드민 주문 상세·환불 — paymentId / PG 안내 카피 */
export const ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL = '결제 ID';
export const ADMIN_SHOP_ORDER_PAYMENT_STATUS_LABEL = '결제 상태';
/**
 * cashDueMinor 표시 라벨 — PortOne/온라인 실결제액.
 * 「현금」을 결제수단으로 오인하지 않도록 사용. (결제수단은 CREDIT_CARD→신용카드)
 */
export const ADMIN_SHOP_ORDER_CASH_DUE_LABEL = '실결제';
/** 포인트 사용액 표시 라벨 */
export const ADMIN_SHOP_ORDER_POINTS_LABEL = '포인트';
export const ADMIN_SHOP_REFUND_PG_HINT =
  '전액 환불 시 PortOne(또는 PG) 결제 취소·회기 원복·포인트 원장·주문 REFUNDED가 함께 반영됩니다.';
export const ADMIN_SHOP_ORDER_LINE_SESSION_LABEL = '회기';

/**
 * 주문 상세 모달 — quiet PortOne 한 줄 (ADMIN_SHOP_REFUND_PG_HINT 파생, 배너 문단 금지).
 * @type {string}
 */
export const ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT =
  'PortOne(또는 PG) 취소·회기 원복·포인트 원장·REFUNDED 동시 반영';

/** 주문 상세 모달 라벨·섹션·CTA 카피 (Clinic-OS SSOT) */
export const ADMIN_SHOP_ORDER_DETAIL_COPY = Object.freeze({
  ORDER_ID: '주문 ID',
  ORDER_STATUS: '주문 상태',
  CLIENT: '내담자',
  PAYMENT_ID: ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL,
  PAYMENT_STATUS: ADMIN_SHOP_ORDER_PAYMENT_STATUS_LABEL,
  ORDER_AMOUNT: '주문 금액',
  ORDERED_AT: '주문 일시',
  LINES_TITLE: '주문 라인',
  LINES_EMPTY: '라인 없음',
  FULFILLMENT_TITLE: '이행 이벤트',
  FULFILLMENT_EMPTY: '이행 이벤트 없음',
  REFUND_PRIMARY: '전액환불',
  DELETE: '삭제',
  QTY_PREFIX: '수량',
  AMOUNT_PREFIX: '금액'
});

export const ADMIN_SHOP_ORDER_DETAIL_TEST_IDS = Object.freeze({
  ROOT: 'admin-shop-order-detail',
  INFO_GRID: 'admin-shop-order-detail-info-grid',
  PORTONE_HINT: 'admin-shop-order-detail-portone-hint',
  PAYMENT_ID: 'admin-shop-order-payment-id',
  ACTIONS: 'admin-shop-order-detail-actions',
  REFUND_PRIMARY: 'admin-shop-order-detail-refund',
  TIMELINE: 'admin-shop-order-detail-timeline',
  TIMELINE_DOT_FIRST: 'admin-shop-order-detail-timeline-dot-first'
});

/** PortOne 기취소·Clinic APPROVED/PAID desync — reconcile-refund CTA */
export const ADMIN_SHOP_RECONCILE_REFUND_COPY = Object.freeze({
  BUTTON: '환불 정합',
  FORCE_BUTTON: '강제 환불 정합',
  HINT: 'PortOne 기취소인데 Clinic이 PAID/APPROVED로 남은 경우 정합합니다.',
  FORCE_HINT: 'PortOne이 PAID여도 관리자 기취소 attest로 Clinic만 맞춥니다.',
  ALREADY_PG_CANCELLED_SYNC: '이미 PG 취소됨 — Clinic 동기화',
  SUCCESS: '환불 정합이 완료되었습니다.',
  FAILED: '환불 정합에 실패했습니다.'
});

/**
 * 전액환불 실패 — PortOne 기취소·중복 취소 (paymentId/secrets 미포함).
 * @type {Readonly<{ ALREADY_CANCELLED: string, DUPLICATE_CANCEL: string }>}
 */
export const ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY = Object.freeze({
  ALREADY_CANCELLED:
    '결제가 이미 취소된 상태입니다. 환불 정합으로 Clinic을 맞춰 주세요.',
  DUPLICATE_CANCEL:
    '이미 처리된 취소 요청입니다. 환불 정합을 사용해 주세요.'
});

/**
 * PG 취소 후 Clinic(회기·ERP·주문 REFUNDED) 미완료 — 부분성공 UI 금지.
 * {@code SHOP_REFUND_CLINIC_INCOMPLETE} / 재시도·환불 정합 유도.
 * @type {string}
 */
export const ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY =
  'PG 취소 후 Clinic(회기 원복·ERP·주문) 반영이 완료되지 않았습니다. 환불을 다시 시도하거나 환불 정합을 진행해 주세요.';

/** BE {@code ShopRefundConstants.ERROR_CODE_CLINIC_INCOMPLETE} */
export const ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE = 'SHOP_REFUND_CLINIC_INCOMPLETE';

export const ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS = Object.freeze({
  BUTTON: 'admin-shop-reconcile-refund',
  FORCE_BUTTON: 'admin-shop-reconcile-refund-force',
  HINT: 'admin-shop-reconcile-refund-hint'
});

/**
 * 목록·상세 표시 금액: pgAmount → cashDueMinor → subtotalMinor.
 *
 * @param {object|null|undefined} row
 * @returns {number|null}
 */
export function resolveAdminShopOrderAmount(row) {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  if (row.pgAmount != null && row.pgAmount !== '') {
    return Number(row.pgAmount);
  }
  if (row.cashDueMinor != null && row.cashDueMinor !== '') {
    return Number(row.cashDueMinor);
  }
  if (row.subtotalMinor != null && row.subtotalMinor !== '') {
    return Number(row.subtotalMinor);
  }
  return null;
}

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
 * 패키지 요금 행의 온라인 내용 편집 경로.
 *
 * @param {string} packageCode 패키지 코드
 * @returns {string}
 */
export function buildAdminShopPackageContentRoute(packageCode) {
  return `${ADMIN_SHOP_ROUTES.CATALOG_SKUS}/package/${encodeURIComponent(String(packageCode))}`;
}

/**
 * @returns {string}
 */
export function buildAdminShopPackageFeesPath() {
  return `${ADMIN_SHOP_API.CATALOG_SKUS}/package-fees`;
}

/**
 * @param {string} packageCode 패키지 코드
 * @returns {string}
 */
export function buildAdminShopPackageFeePath(packageCode) {
  return `${buildAdminShopPackageFeesPath()}/${encodeURIComponent(String(packageCode))}`;
}

/**
 * @param {string} packageCode 패키지 코드
 * @returns {string}
 */
export function buildAdminShopPackageFeeVisiblePath(packageCode) {
  return `${buildAdminShopPackageFeePath(packageCode)}/catalog-visible`;
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
 * @param {string} orderPublicId
 * @returns {string}
 */
export function buildAdminShopOrderFulfillRetryPath(orderPublicId) {
  return `${buildAdminShopOrderPath(orderPublicId)}/fulfill-retry`;
}

/**
 * @param {string} orderPublicId
 * @returns {string}
 */
export function buildAdminShopOrderReconcilePaymentPath(orderPublicId) {
  return `${buildAdminShopOrderPath(orderPublicId)}/reconcile-payment`;
}

/**
 * @param {string} orderPublicId
 * @param {boolean} [force]
 * @returns {string}
 */
export function buildAdminShopOrderReconcileRefundPath(orderPublicId, force = false) {
  const base = `${buildAdminShopOrderPath(orderPublicId)}/reconcile-refund`;
  if (force === true) {
    return `${base}?force=true`;
  }
  return base;
}

/**
 * @param {{ paymentId?: string, cardApprovalNumber?: string }} payload
 * @returns {Readonly<{ paymentId?: string, cardApprovalNumber?: string }>}
 */
export function buildAdminShopReconcilePaymentBody(payload = {}) {
  const body = {};
  if (payload.paymentId != null && String(payload.paymentId).trim()) {
    body.paymentId = String(payload.paymentId).trim();
  }
  if (payload.cardApprovalNumber != null && String(payload.cardApprovalNumber).trim()) {
    body.cardApprovalNumber = String(payload.cardApprovalNumber).trim();
  }
  return body;
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

/**
 * Map refund API errors to safe user copy (never echo paymentId/secrets).
 *
 * @param {unknown} error
 * @returns {string|null} dedicated copy, or null to fall back to generic/raw safe message
 */
export function resolveAdminShopRefundErrorCopy(error) {
  if (error == null || typeof error !== 'object') {
    return null;
  }
  const msg = error.message != null ? String(error.message) : '';
  const code = error.code != null ? String(error.code) : '';
  const errorCode = error.errorCode != null ? String(error.errorCode) : '';
  const responseCode = error.response?.data?.errorCode != null
    ? String(error.response.data.errorCode)
    : (error.response?.data?.code != null ? String(error.response.data.code) : '');
  const haystack = `${msg} ${code} ${errorCode} ${responseCode}`.toLowerCase();

  // Clinic incomplete 를 먼저 판정 — 메시지에 "이미 취소"가 포함돼도 기취소 카피로 오매핑 금지
  if (
    code === ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE
    || errorCode === ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE
    || responseCode === ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE
    || haystack.includes('shop_refund_clinic_incomplete')
    || haystack.includes('clinic 체인')
    || haystack.includes('회기 원복')
    || haystack.includes('reconcile-refund')
  ) {
    return ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY;
  }
  if (
    haystack.includes('duplicate')
    || haystack.includes('중복')
    || haystack.includes('이미 처리')
  ) {
    return ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.DUPLICATE_CANCEL;
  }
  if (
    haystack.includes('이미 취소')
    || haystack.includes('already cancel')
    || haystack.includes('cancelled')
    || haystack.includes('기취소')
  ) {
    return ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.ALREADY_CANCELLED;
  }
  return null;
}
