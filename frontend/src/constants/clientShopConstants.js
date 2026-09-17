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

/** 생성형 SVG placeholder — 400×400, 카테고리별 톤 (디자인 토큰 hex) */
export const SHOP_CATALOG_PLACEHOLDER_SIZE_PX = 400;

export const SHOP_CATALOG_PLACEHOLDER_TITLE_FALLBACK = '상품';

/** @type {Readonly<Record<string, { background: string, accent: string, text: string }>>} */
export const SHOP_CATALOG_PLACEHOLDER_SVG_COLORS = {
  [SHOP_CATALOG_CATEGORY.CONSULTATION]: {
    background: '#F5F3EF',
    accent: 'var(--mg-color-primary-main)',
    text: 'var(--mg-color-primary-main)'
  },
  [SHOP_CATALOG_CATEGORY.ASSESSMENT]: {
    background: '#EEF4F1',
    accent: '#5C7A6B',
    text: 'var(--mg-color-primary-main)'
  }
};

/**
 * PLP 탭 필터용 — API·DB 대소문자·공백 차이 흡수.
 *
 * @param {string|undefined|null} value
 * @returns {string}
 */
export const normalizeShopCatalogCategory = (value) => {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (raw === SHOP_CATALOG_CATEGORY.ASSESSMENT) {
    return SHOP_CATALOG_CATEGORY.ASSESSMENT;
  }
  return SHOP_CATALOG_CATEGORY.CONSULTATION;
};

/** E2E·Playwright — 첫 노출 SKU 「담기」 */
export const SHOP_SKU_ADD_FIRST_TEST_ID = 'shop-sku-add-first';

/** E2E — 활성 탭에 SKU 없음(로딩 완료 후) */
export const CLIENT_SHOP_CATALOG_EMPTY_TEST_ID = 'client-shop-catalog-empty';

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

/** 체크아웃·결제 준비 API / 단계별 실패 UX */
export const SHOP_CHECKOUT_ERROR_COPY = {
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  CHECKOUT_FAILED: '체크아웃에 실패했습니다.',
  CHECKOUT_ORDER_ID_MISSING: '주문 번호를 받지 못했습니다. 다시 시도해 주세요.',
  PREPARE_FAILED: '결제 준비에 실패했습니다.',
  PAYMENT_LAUNCH_FAILED: '결제 모듈 실행에 실패했습니다.',
  VERIFY_FAILED: '결제 검증에 실패했습니다. 주문 상세에서 상태를 확인해 주세요.',
  INVALID_CASH_AMOUNT: '결제 금액이 올바르지 않습니다.',
  CUSTOMER_EMAIL_REQUIRED:
    '결제하려면 이메일이 필요합니다. 계정 이메일이 없으면 체크아웃에서 이메일을 입력해 주세요.',
  CUSTOMER_FULL_NAME_REQUIRED:
    '결제하려면 이름이 필요합니다. 계정 이름이 없으면 체크아웃에서 이름을 입력해 주세요.',
  CUSTOMER_PHONE_REQUIRED:
    '결제하려면 휴대폰 번호가 필요합니다. 계정 번호가 없으면 체크아웃에서 휴대폰 번호를 입력해 주세요.'
};

/** 체크아웃·주문 상세 — 세션 이메일 없을 때 PortOne customer.email 입력 */
export const SHOP_CHECKOUT_EMAIL_COPY = {
  SECTION_TITLE: '결제 이메일',
  LABEL: '이메일',
  PLACEHOLDER: 'name@example.com',
  HELP: '계정에 이메일이 없어 결제용 이메일을 입력해 주세요.',
  REQUIRED: '결제하려면 이메일을 입력해 주세요.',
  INVALID: '올바른 이메일 형식을 입력해 주세요.'
};

/** 체크아웃·주문 상세 — 세션 이름 없을 때 PortOne customer.fullName 입력 */
export const SHOP_CHECKOUT_FULL_NAME_COPY = {
  SECTION_TITLE: '결제 이름',
  LABEL: '이름',
  PLACEHOLDER: '홍길동',
  HELP: '계정에 이름이 없어 결제용 이름을 입력해 주세요.',
  REQUIRED: '결제하려면 이름을 입력해 주세요.'
};

/** 체크아웃·주문 상세 — 세션 휴대폰 없을 때 PortOne customer.phoneNumber 입력 */
export const SHOP_CHECKOUT_PHONE_COPY = {
  SECTION_TITLE: '결제 휴대폰 번호',
  LABEL: '휴대폰 번호',
  PLACEHOLDER: '01012345678',
  HELP: '계정에 휴대폰 번호가 없어 결제용 휴대폰 번호를 입력해 주세요.',
  REQUIRED: '결제하려면 휴대폰 번호를 입력해 주세요.',
  INVALID: '올바른 휴대폰 번호를 입력해 주세요.'
};

/** prepare → PortOne / paymentUrl 진입 UX */
export const SHOP_PAYMENT_LAUNCH_COPY = {
  ORDER_NAME: '샵 주문 결제',
  MODULE_UNAVAILABLE:
    '결제 모듈을 열 수 없습니다. 주문 상세에서 다시 결제를 시도해 주세요.',
  WINDOW_FEATURES: 'noopener,noreferrer',
  TEST_MODE_REQUIRED:
    '현재는 테스트 결제만 허용됩니다. 테스트 모드(prepare.testMode)가 아닐 때는 결제를 진행할 수 없습니다.',
  CUSTOMER_EMAIL_REQUIRED:
    '결제하려면 이메일이 필요합니다. 계정 이메일이 없으면 체크아웃에서 이메일을 입력해 주세요.',
  CUSTOMER_FULL_NAME_REQUIRED:
    '결제하려면 이름이 필요합니다. 계정 이름이 없으면 체크아웃에서 이름을 입력해 주세요.',
  CUSTOMER_PHONE_REQUIRED:
    '결제하려면 휴대폰 번호가 필요합니다. 계정 번호가 없으면 체크아웃에서 휴대폰 번호를 입력해 주세요.'
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

/** E2E·Playwright용 data-testid */
export const CLIENT_SHOP_TEST_IDS = {
  SESSION_LOADING: 'client-shop-session-loading',
  CATALOG_PAGE: 'client-shop-catalog-page',
  CATALOG_LOADING: 'client-shop-catalog-loading',
  CART_PAGE: 'client-shop-cart-page',
  PDP: 'client-shop-pdp',
  PDP_ADD_TO_CART: 'pdp-add-to-cart-button',
  SKU_CARD_THUMBNAIL: 'sku-card-thumbnail'
};

export const CLIENT_SHOP_SESSION_LOADING_COPY = '불러오는 중…';
