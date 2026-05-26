/**
 * 내담자 쇼핑 UI 라우트·카테고리 상수 (라벨은 UI 전용, SKU·가격은 API).
 *
 * @author MindGarden
 * @since 2026-05-19
 */

/** 임시 비노출 — 더보기 메뉴·딥링크 방어. 재개 시 false */
export const CLIENT_SHOP_MENU_TEMPORARILY_DISABLED = true;

/**
 * 더보기 「온라인 쇼핑」 메뉴 노출 여부
 *
 * @param clientShopEnabled 테넌트 CLIENT_SHOP 컴포넌트 활성 여부
 */
export const isClientShopMoreMenuVisible = (
  clientShopEnabled: boolean | undefined,
): boolean =>
  clientShopEnabled === true && !CLIENT_SHOP_MENU_TEMPORARILY_DISABLED;

/** 쇼핑 스택 직접 진입 시 안내 (임시 비노출) */
export const CLIENT_SHOP_TEMPORARILY_UNAVAILABLE_COPY = {
  TITLE: '준비 중',
  DESCRIPTION: '온라인 쇼핑은 곧 제공될 예정입니다.',
} as const;

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

/** 생성형 SVG placeholder — 400×400, 카테고리별 톤 (디자인 토큰 hex) */
export const SHOP_CATALOG_PLACEHOLDER_SIZE_PX = 400;

export const SHOP_CATALOG_PLACEHOLDER_TITLE_FALLBACK = '상품';

export const SHOP_CATALOG_PLACEHOLDER_SVG_COLORS: Readonly<
  Record<ShopCatalogCategory, { background: string; accent: string; text: string }>
> = {
  [SHOP_CATALOG_CATEGORY.CONSULTATION]: {
    background: '#F5F3EF',
    accent: '#3D5246',
    text: '#3D5246',
  },
  [SHOP_CATALOG_CATEGORY.ASSESSMENT]: {
    background: '#EEF4F1',
    accent: '#5C7A6B',
    text: '#3D5246',
  },
};

/**
 * PLP 탭 필터용 — API·DB 대소문자·공백 차이 흡수.
 *
 * @param value catalogCategory 원시값
 */
export const normalizeShopCatalogCategory = (
  value?: string | null,
): ShopCatalogCategory => {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (raw === SHOP_CATALOG_CATEGORY.ASSESSMENT) {
    return SHOP_CATALOG_CATEGORY.ASSESSMENT;
  }
  return SHOP_CATALOG_CATEGORY.CONSULTATION;
};

/** E2E·Maestro용 testID (웹 data-testid와 동일 문자열) */
export const CLIENT_SHOP_TEST_IDS = {
  SESSION_LOADING: 'client-shop-session-loading',
  CATALOG_PAGE: 'client-shop-catalog-page',
  CATALOG_LOADING: 'client-shop-catalog-loading',
  CART_PAGE: 'client-shop-cart-page',
  PDP: 'client-shop-pdp',
  PDP_ADD_TO_CART: 'pdp-add-to-cart-button',
  SKU_CARD_THUMBNAIL: 'sku-card-thumbnail',
} as const;

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

/** 체크아웃 — 상담(CONSULTATION) 매핑 선택 UX */
export const SHOP_CHECKOUT_MAPPING_COPY = {
  SECTION_TITLE: '담당 상담사',
  SELECT_PLACEHOLDER: '상담사를 선택해 주세요',
  NO_MAPPING:
    '상담 상품 결제를 위해 센터에 상담 연결을 요청해 주세요. 연결 후 다시 결제해 주세요.',
  REQUIRED: '담당 상담사를 선택해 주세요.',
  AUTO_PREFIX: '담당 상담사',
} as const;

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
