/**
 * 내담자 쇼핑 UI 라우트·카테고리 상수 (라벨은 UI 전용, SKU·가격은 API).
 *
 * @author MindGarden
 * @since 2026-05-19
 */

export const CLIENT_SHOP_ROUTES = {
  CATALOG: '/client/shop',
  CART: '/client/shop/cart',
  CHECKOUT: '/client/shop/checkout',
  POINTS: '/client/shop/points',
  ORDERS: '/client/shop/orders',
  SKU_DETAIL: '/client/shop/sku'
};

/**
 * @param {string} orderPublicId
 * @returns {string}
 */
export const buildShopOrderDetailPath = (orderPublicId) =>
  `${CLIENT_SHOP_ROUTES.ORDERS}/${encodeURIComponent(orderPublicId)}`;

/**
 * @param {string} skuCode
 * @returns {string}
 */
export const buildShopSkuDetailPath = (skuCode) =>
  `${CLIENT_SHOP_ROUTES.SKU_DETAIL}/${encodeURIComponent(skuCode)}`;

/** API ShopClientOrderStatus → UI 라벨 */
export const SHOP_ORDER_STATUS_LABELS = {
  CREATED: '생성',
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
  EXPIRED: '만료',
  REFUNDED: '환불됨'
};

/** API ShopOrderFulfillmentStatus → UI 라벨 */
export const SHOP_FULFILLMENT_STATUS_LABELS = {
  PENDING: '대기',
  COMPLETED: '완료',
  SKIPPED: '건너뜀'
};

/** API catalogCategory → 이행 UI 라벨 */
export const SHOP_FULFILLMENT_CATEGORY_LABELS = {
  CONSULTATION: '상담',
  ASSESSMENT: '심리검사'
};

/**
 * @param {{ category?: string, status?: string }} line
 * @returns {string}
 */
export const formatShopFulfillmentBadge = (line) => {
  if (!line) {
    return '—';
  }
  const categoryLabel =
    SHOP_FULFILLMENT_CATEGORY_LABELS[line.category] || line.category || '—';
  const statusLabel =
    SHOP_FULFILLMENT_STATUS_LABELS[line.status] || line.status || '—';
  return `${categoryLabel} · ${statusLabel}`;
};

/** API labelKey → UI 라벨 (shop.point.ledger.*) */
export const POINT_LEDGER_LABEL_KEYS = {
  'shop.point.ledger.earn': '적립',
  'shop.point.ledger.commit': '사용',
  'shop.point.ledger.hold': '예약',
  'shop.point.ledger.release': '예약 해제'
};

/** API PointLedgerEntryType → UI 라벨 (fallback) */
export const POINT_LEDGER_TYPE_LABELS = {
  EARN: '적립',
  COMMIT: '사용',
  HOLD: '예약',
  RELEASE: '예약 해제'
};

/** 원장 default limit */
export const POINT_LEDGER_DEFAULT_LIMIT = 20;

/**
 * @param {{ labelKey?: string, type?: string }} entry
 * @returns {string}
 */
export const resolvePointLedgerLabel = (entry) => {
  if (!entry) {
    return '—';
  }
  if (entry.labelKey && POINT_LEDGER_LABEL_KEYS[entry.labelKey]) {
    return POINT_LEDGER_LABEL_KEYS[entry.labelKey];
  }
  if (entry.type && POINT_LEDGER_TYPE_LABELS[entry.type]) {
    return POINT_LEDGER_TYPE_LABELS[entry.type];
  }
  return entry.type || '—';
};

/**
 * @param {string} type
 * @returns {boolean}
 */
export const isPointLedgerCredit = (type) => type === 'EARN' || type === 'RELEASE';

/**
 * @param {{ status?: string, cashDueMinor?: number }} [order]
 * @returns {boolean}
 */
export const isShopOrderAwaitingPayment = (order) =>
  Boolean(
    order &&
      order.status !== 'REFUNDED' &&
      (order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') &&
      (order.cashDueMinor ?? 0) > 0
  );

/** API catalogCategory 값 */
export const SHOP_CATALOG_CATEGORY = {
  CONSULTATION: 'CONSULTATION',
  ASSESSMENT: 'ASSESSMENT'
};

/** PLP 탭 — 라벨만 UI 상수, 필터 키는 API catalogCategory */
export const SHOP_CATEGORY_TABS = [
  { key: SHOP_CATALOG_CATEGORY.CONSULTATION, label: '상담 패키지' },
  { key: SHOP_CATALOG_CATEGORY.ASSESSMENT, label: '심리 검사' }
];

export const SHOP_CHECKOUT_AGREEMENT_LABEL =
  '디지털 상품 환불 규정 및 결제 진행에 동의합니다.';

/** 체크아웃 — 상담(CONSULTATION) 매핑 선택 UX */
export const SHOP_CHECKOUT_MAPPING_COPY = {
  SECTION_TITLE: '담당 상담사',
  SELECT_PLACEHOLDER: '상담사를 선택해 주세요',
  NO_MAPPING:
    '상담 상품 결제를 위해 센터에 상담 연결을 요청해 주세요. 연결 후 다시 결제해 주세요.',
  REQUIRED: '담당 상담사를 선택해 주세요.',
  AUTO_PREFIX: '담당 상담사'
};

export const SHOP_BANNER_PLACEHOLDER_COPY =
  '테넌트 배너·환영 문구는 설정 연동 후 표시됩니다.';

/** TenantComponent off 시 직접 URL·빈 API 응답과 정합되는 안내 */
export const CLIENT_SHOP_UNAVAILABLE_COPY = {
  TITLE: '온라인 쇼핑을 이용할 수 없습니다',
  DESCRIPTION: '현재 센터에서 온라인 쇼핑 서비스가 제공되지 않습니다.'
};

export const CLIENT_REWARD_UNAVAILABLE_COPY = {
  TITLE: '포인트·리워드를 이용할 수 없습니다',
  DESCRIPTION: '현재 센터에서 포인트·리워드 서비스가 제공되지 않습니다.'
};
