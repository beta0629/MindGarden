/**
 * 내담자 쇼핑 UI 라우트·카테고리 상수 (라벨은 UI 전용, SKU·가격은 API).
 *
 * @author MindGarden
 * @since 2026-05-19
 */

/** Expo Router 경로 — `(client)/(shop)/` 스택 */
export const CLIENT_SHOP_ROUTES = {
  CATALOG: '/(client)/(shop)',
  CART: '/(client)/(shop)/cart',
  CHECKOUT: '/(client)/(shop)/checkout',
  POINTS: '/(client)/(shop)/points',
  ORDERS: '/(client)/(shop)/orders',
  SKU_DETAIL: '/(client)/(shop)/sku',
} as const;

/**
 * @param orderPublicId 주문 공개 ID
 */
export const buildShopOrderDetailPath = (orderPublicId: string): string =>
  `${CLIENT_SHOP_ROUTES.ORDERS}/${encodeURIComponent(orderPublicId)}`;

/**
 * @param skuCode SKU 코드
 */
export const buildShopSkuDetailPath = (skuCode: string): string =>
  `${CLIENT_SHOP_ROUTES.SKU_DETAIL}/${encodeURIComponent(skuCode)}`;

/**
 * @param order 주문 요약·상세
 */
export const isShopOrderAwaitingPayment = (order?: {
  status?: string;
  cashDueMinor?: number;
} | null): boolean =>
  Boolean(
    order &&
      order.status !== 'REFUNDED' &&
      (order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') &&
      (order.cashDueMinor ?? 0) > 0,
  );

/** API catalogCategory 값 */
export const SHOP_CATALOG_CATEGORY = {
  CONSULTATION: 'CONSULTATION',
  ASSESSMENT: 'ASSESSMENT',
} as const;

export type ShopCatalogCategory =
  (typeof SHOP_CATALOG_CATEGORY)[keyof typeof SHOP_CATALOG_CATEGORY];

/** PLP 탭 — 라벨만 UI 상수, 필터 키는 API catalogCategory */
export const SHOP_CATEGORY_TABS: ReadonlyArray<{
  key: ShopCatalogCategory;
  label: string;
}> = [
  { key: SHOP_CATALOG_CATEGORY.CONSULTATION, label: '상담 패키지' },
  { key: SHOP_CATALOG_CATEGORY.ASSESSMENT, label: '심리 검사' },
];

export const SHOP_CHECKOUT_AGREEMENT_LABEL =
  '디지털 상품 환불 규정 및 결제 진행에 동의합니다.';

export const SHOP_BANNER_PLACEHOLDER_COPY =
  '테넌트 배너·환영 문구는 설정 연동 후 표시됩니다.';

export const SHOP_ORDER_STATUS_LABELS: Record<string, string> = {
  CREATED: '생성',
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
  EXPIRED: '만료',
  REFUNDED: '환불됨',
};

/** API ShopOrderFulfillmentStatus → UI 라벨 */
export const SHOP_FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  COMPLETED: '완료',
  SKIPPED: '건너뜀',
};

/** API catalogCategory → 이행 UI 라벨 */
export const SHOP_FULFILLMENT_CATEGORY_LABELS: Record<string, string> = {
  CONSULTATION: '상담',
  ASSESSMENT: '심리검사',
};

export type ShopOrderFulfillmentLine = {
  skuCode: string;
  category: string;
  status: string;
  message?: string | null;
};

/**
 * @param line 이행 라인
 */
export const formatShopFulfillmentBadge = (line?: ShopOrderFulfillmentLine | null): string => {
  if (!line) {
    return '—';
  }
  const categoryLabel =
    SHOP_FULFILLMENT_CATEGORY_LABELS[line.category] ?? line.category ?? '—';
  const statusLabel = SHOP_FULFILLMENT_STATUS_LABELS[line.status] ?? line.status ?? '—';
  return `${categoryLabel} · ${statusLabel}`;
};

/** API labelKey → UI 라벨 (shop.point.ledger.*) */
export const POINT_LEDGER_LABEL_KEYS: Record<string, string> = {
  'shop.point.ledger.earn': '적립',
  'shop.point.ledger.commit': '사용',
  'shop.point.ledger.hold': '예약',
  'shop.point.ledger.release': '예약 해제',
};

/** API PointLedgerEntryType → UI 라벨 (fallback) */
export const POINT_LEDGER_TYPE_LABELS: Record<string, string> = {
  EARN: '적립',
  COMMIT: '사용',
  HOLD: '예약',
  RELEASE: '예약 해제',
};

export const POINT_LEDGER_DEFAULT_LIMIT = 20;

export type PointLedgerEntryType = 'HOLD' | 'RELEASE' | 'COMMIT' | 'EARN';

/**
 * @param entry 원장 항목
 */
export const resolvePointLedgerLabel = (entry?: {
  labelKey?: string;
  type?: string;
} | null): string => {
  if (!entry) {
    return '—';
  }
  if (entry.labelKey) {
    const labelKeyLabel = POINT_LEDGER_LABEL_KEYS[entry.labelKey];
    if (labelKeyLabel) {
      return labelKeyLabel;
    }
  }
  if (entry.type) {
    const typeLabel = POINT_LEDGER_TYPE_LABELS[entry.type];
    if (typeLabel) {
      return typeLabel;
    }
  }
  return entry.type || '—';
};

/**
 * @param type 원장 유형
 */
export const isPointLedgerCredit = (type?: string): boolean =>
  type === 'EARN' || type === 'RELEASE';
