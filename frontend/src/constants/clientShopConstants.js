/**
 * 내담자 쇼핑 UI 라우트·카테고리 상수 (라벨은 UI 전용, SKU·가격은 API).
 *
 * @author MindGarden
 * @since 2026-05-19
 */

export {
  CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE,
  CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE
} from './legalPublic';

export const CLIENT_SHOP_ROUTES = {
  CATALOG: '/client/shop',
  CART: '/client/shop/cart',
  CHECKOUT: '/client/shop/checkout',
  POINTS: '/client/shop/points',
  ORDERS: '/client/shop/orders',
  SKU_DETAIL: '/client/shop/sku',
  /** PortOne redirectUrl 복귀 → BE verify */
  PAYMENT_RETURN: '/client/shop/payment-return'
};

/**
 * @param {string} orderPublicId
 * @returns {string}
 */
export const buildShopOrderDetailPath = (orderPublicId) =>
  `${CLIENT_SHOP_ROUTES.ORDERS}/${encodeURIComponent(orderPublicId)}`;

/**
 * PortOne redirect 복귀 시 verify 컨텍스트 sessionStorage 키·필드.
 * 매직 문자열 분산 금지 — stash/read/clear는 이 상수만 사용.
 */
export const CLIENT_SHOP_PENDING_VERIFY_STORAGE = {
  KEY: 'mg.clientShop.pendingPaymentVerify',
  FIELD_PAYMENT_ID: 'paymentId',
  FIELD_ORDER_PUBLIC_ID: 'orderPublicId',
  FIELD_CASH_AMOUNT: 'cashAmount'
};

/**
 * PortOne redirectUrl용 절대(가능하면) 복귀 URL.
 * PortOne이 복귀 시 paymentId·code·message를 쿼리에 붙인다.
 *
 * @param {string} orderPublicId
 * @returns {string}
 */
export const buildShopPaymentReturnUrl = (orderPublicId) => {
  const id =
    orderPublicId != null && String(orderPublicId).trim()
      ? String(orderPublicId).trim()
      : '';
  const path = id
    ? `${CLIENT_SHOP_ROUTES.PAYMENT_RETURN}?orderPublicId=${encodeURIComponent(id)}`
    : CLIENT_SHOP_ROUTES.PAYMENT_RETURN;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
};

/**
 * @param {{ paymentId: string, orderPublicId?: string|null, cashAmount: number }} payload
 * @returns {void}
 */
export const stashShopPendingPaymentVerify = (payload) => {
  if (typeof sessionStorage === 'undefined' || !payload) {
    return;
  }
  const paymentId =
    payload.paymentId != null && String(payload.paymentId).trim()
      ? String(payload.paymentId).trim()
      : '';
  const cashAmount = Number(payload.cashAmount);
  if (!paymentId || !Number.isFinite(cashAmount) || cashAmount <= 0) {
    return;
  }
  const orderPublicId =
    payload.orderPublicId != null && String(payload.orderPublicId).trim()
      ? String(payload.orderPublicId).trim()
      : null;
  const { KEY, FIELD_PAYMENT_ID, FIELD_ORDER_PUBLIC_ID, FIELD_CASH_AMOUNT } =
    CLIENT_SHOP_PENDING_VERIFY_STORAGE;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        [FIELD_PAYMENT_ID]: paymentId,
        [FIELD_ORDER_PUBLIC_ID]: orderPublicId,
        [FIELD_CASH_AMOUNT]: cashAmount
      })
    );
  } catch {
    // sessionStorage 불가(프라이빗 모드 등) — redirect verify는 주문 조회로 폴백
  }
};

/**
 * @returns {{ paymentId: string, orderPublicId: string|null, cashAmount: number }|null}
 */
export const readShopPendingPaymentVerify = () => {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const { KEY, FIELD_PAYMENT_ID, FIELD_ORDER_PUBLIC_ID, FIELD_CASH_AMOUNT } =
    CLIENT_SHOP_PENDING_VERIFY_STORAGE;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const paymentId =
      parsed[FIELD_PAYMENT_ID] != null && String(parsed[FIELD_PAYMENT_ID]).trim()
        ? String(parsed[FIELD_PAYMENT_ID]).trim()
        : '';
    const cashAmount = Number(parsed[FIELD_CASH_AMOUNT]);
    if (!paymentId || !Number.isFinite(cashAmount) || cashAmount <= 0) {
      return null;
    }
    const orderPublicId =
      parsed[FIELD_ORDER_PUBLIC_ID] != null &&
      String(parsed[FIELD_ORDER_PUBLIC_ID]).trim()
        ? String(parsed[FIELD_ORDER_PUBLIC_ID]).trim()
        : null;
    return { paymentId, orderPublicId, cashAmount };
  } catch {
    return null;
  }
};

/**
 * @returns {void}
 */
export const clearShopPendingPaymentVerify = () => {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(CLIENT_SHOP_PENDING_VERIFY_STORAGE.KEY);
  } catch {
    // ignore
  }
};

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
  SKIPPED: '건너뜀',
  FAILED: '실패',
  REVERSED: '원복'
};

/**
 * 이행 재시도(재이행) 카피 — 내담자 in-flight 1회 가드 / 어드민 반복.
 * HINT「한 번만 눌러주세요」= 더블탭 방지. FAILED+retryable 이면 버튼 재노출.
 */
export const SHOP_FULFILLMENT_RETRY_COPY = {
  BUTTON: '재이행',
  HINT: '한 번만 눌러주세요',
  LOADING: '재이행',
  SUCCESS: '이행을 다시 처리했습니다.',
  FAILED: '재이행에 실패했습니다.'
};

/** 이행 재시도 test id */
export const SHOP_FULFILLMENT_RETRY_TEST_IDS = {
  BUTTON: 'shop-fulfillment-retry',
  HINT: 'shop-fulfillment-retry-hint',
  ADMIN_BUTTON: 'admin-shop-fulfillment-retry'
};

/**
 * SSOT: 재이행 가능 라인은 FAILED + retryable 만.
 * COMPLETED / PENDING / SKIPPED / REVERSED 등은 retryable 플래그가 true여도 false.
 *
 * @param {{ status?: string, message?: string, retryable?: boolean }|null|undefined} line
 * @returns {boolean}
 */
export const isShopFulfillmentRetryable = (line) => {
  if (!line) {
    return false;
  }
  const status = line.status != null ? String(line.status) : '';
  if (status !== 'FAILED') {
    return false;
  }
  if (line.retryable === true) {
    return true;
  }
  if (line.retryable === false) {
    return false;
  }
  const message = line.message != null ? String(line.message) : '';
  return /retryable/i.test(message);
};

/**
 * @param {Array<{ status?: string, message?: string, retryable?: boolean }>|null|undefined} lines
 * @returns {boolean}
 */
export const hasShopFulfillmentRetryableLine = (lines) =>
  Array.isArray(lines) && lines.some(isShopFulfillmentRetryable);

/**
 * SSOT: UI/retry helpers read one list.
 * Prefer fulfillmentEvents; fall back to fulfillmentLines (lines-only / null events).
 *
 * @param {Array|{ fulfillmentLines?: Array, fulfillmentEvents?: Array }|null|undefined} orderOrLines
 * @returns {Array}
 */
export const resolveShopFulfillmentLines = (orderOrLines) => {
  if (Array.isArray(orderOrLines)) {
    return orderOrLines;
  }
  const events = orderOrLines?.fulfillmentEvents;
  if (events != null) {
    return Array.isArray(events) ? events : [];
  }
  const lines = orderOrLines?.fulfillmentLines;
  return Array.isArray(lines) ? lines : [];
};

/**
 * 내담자 재이행 노출 조건: PAID + retryable FAILED 라인만.
 * {@code clientFulfillRetryAttempted} 는 서버 성공 재이행 소진 장부이며,
 * FAILED+retryable 잔존 중에는 버튼을 숨기지 않는다(성공 소진 시 retryable 라인 해소 → 자연 숨김).
 *
 * @param {{
 *   status?: string,
 *   clientFulfillRetryAttempted?: boolean,
 *   fulfillmentLines?: Array<{ status?: string, message?: string, retryable?: boolean }>,
 *   fulfillmentEvents?: Array<{ status?: string, message?: string, retryable?: boolean }>
 * }|null|undefined} order
 * @returns {boolean}
 */
export const canClientShopFulfillRetry = (order) =>
  order?.status === 'PAID'
  && hasShopFulfillmentRetryableLine(resolveShopFulfillmentLines(order));

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
 * PortOne 재기동(prepare) 대상 — CREATED|PENDING_PAYMENT 만.
 * EXPIRED 는 prepare 금지(confirm/verify 만 허용).
 *
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

/**
 * 주문 상세 「결제 확인」 CTA — PENDING_PAYMENT|EXPIRED + paymentId + cashDue.
 * EXPIRED 는 Path B verify 복구만 (prepare/PortOne 재기동 금지).
 *
 * @param {{ status?: string, paymentId?: string, cashDueMinor?: number }} [order]
 * @returns {boolean}
 */
export const canConfirmShopPayment = (order) => {
  if (!order) {
    return false;
  }
  const statusOk =
    order.status === 'PENDING_PAYMENT' || order.status === 'EXPIRED';
  const paymentId =
    order.paymentId != null && String(order.paymentId).trim()
      ? String(order.paymentId).trim()
      : '';
  return Boolean(statusOk && paymentId && (order.cashDueMinor ?? 0) > 0);
};

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

/** 회기수·단회기/패키지 표시 라벨 (UI) */
export const SHOP_SESSION_COUNT_COPY = {
  LABEL: '회기수',
  UNIT_SUFFIX: '회',
  TYPE_SINGLE: '단회기',
  TYPE_PACKAGE: '패키지'
};

/**
 * @param {number|string|null|undefined} sessionCount
 * @param {{ labelSingle?: string, labelPackage?: string }} [labels]
 * @returns {string}
 */
export function formatShopSessionCountDisplay(sessionCount, labels = {}) {
  const n = Number(sessionCount);
  const count = Number.isFinite(n) && n > 0 ? n : 1;
  const typeLabel =
    count === 1
      ? labels.labelSingle || SHOP_SESSION_COUNT_COPY.TYPE_SINGLE
      : labels.labelPackage || SHOP_SESSION_COUNT_COPY.TYPE_PACKAGE;
  return `${count}${SHOP_SESSION_COUNT_COPY.UNIT_SUFFIX} · ${typeLabel}`;
}

/** 체크아웃 — 상담(CONSULTATION) 매핑 선택 UX */
export const SHOP_CHECKOUT_MAPPING_COPY = {
  SECTION_TITLE: '담당 상담사',
  SELECT_PLACEHOLDER: '상담사를 선택해 주세요',
  NO_MAPPING:
    '상담 상품 결제를 위해 센터에 상담 연결을 요청해 주세요. 연결 후 다시 결제해 주세요.',
  REQUIRED: '담당 상담사를 선택해 주세요.',
  AUTO_PREFIX: '담당 상담사'
};

/**
 * PortOne SDK customer.fullName soft fallback (BE preparePayment "고객" 과 동일).
 * 결제 게이트 fail-closed 대상이 아님.
 */
export const PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK = '고객';

/** prepare → PortOne 진입 UX (게이트 = 휴대폰 인증 ONLY) */
export const SHOP_PAYMENT_LAUNCH_COPY = {
  ORDER_NAME: '샵 주문 결제',
  MODULE_UNAVAILABLE:
    '결제 모듈을 열 수 없습니다. 주문 상세에서 다시 결제를 시도해 주세요.',
  WINDOW_FEATURES: 'noopener,noreferrer',
  TEST_MODE_REQUIRED:
    '현재는 테스트 결제만 허용됩니다. 테스트 모드(prepare.testMode)가 아닐 때는 결제를 진행할 수 없습니다.',
  /** 프로필 편집 안내 — 결제 게이트 차단용 아님 */
  CUSTOMER_EMAIL_REQUIRED:
    '계정 이메일은 설정(/client/settings)에서 등록·변경할 수 있습니다. 결제는 휴대폰 인증만 필요합니다.',
  /** 프로필 편집 안내 — 결제 게이트 차단용 아님 */
  CUSTOMER_FULL_NAME_REQUIRED:
    '이름은 설정(/client/settings)에서 입력·변경할 수 있습니다. 결제는 휴대폰 인증만 필요합니다.',
  CUSTOMER_PHONE_REQUIRED:
    '결제하려면 휴대폰 번호가 필요합니다. 설정(/client/settings)에서 휴대폰 번호를 입력해 주세요.',
  CUSTOMER_PHONE_UNVERIFIED:
    '결제하려면 휴대폰 인증이 필요합니다. 설정(/client/settings)에서 휴대폰 번호를 인증해 주세요.',
  /** 체크아웃 create 직후 PortOne 미기동으로 주문을 취소했을 때 */
  ORPHAN_ORDER_CANCELLED:
    '결제 정보를 확인할 수 없어 주문을 취소했습니다. 설정(/client/settings)에서 휴대폰 인증을 확인한 뒤 다시 시도해 주세요.',
  PAYMENT_COMPLETED: '결제가 완료되었습니다.',
  PAYMENT_MODULE_CALLED:
    '결제 모듈 호출이 완료되었습니다. 승인 반영까지 잠시 기다려 주세요.',
  ORDER_ACCEPTED_FOLLOW_GUIDE:
    '주문이 접수되었습니다. 결제 안내에 따라 진행해 주세요.',
  /** PENDING_PAYMENT|EXPIRED + paymentId — 주문 상세에서 PortOne 결제 재검증 */
  CONFIRM_PENDING_PAYMENT: '결제 확인',
  CONFIRM_PENDING_PAYMENT_VERIFYING: '결제를 확인하고 있습니다…',
  /** 주문 상세 — BE paymentId 노출 라벨 (브랜드명 금지) */
  PAYMENT_ID_LABEL: '결제 ID'
};

/**
 * PortOne SDK 성공 직후 BE verify 재시도 (REST PAID 지연 대비).
 * 최종 실패만 throw — soft-fail 금지.
 */
export const SHOP_PAYMENT_VERIFY_RETRY = {
  MAX_ATTEMPTS: 5,
  BASE_DELAY_MS: 400,
  DELAY_INCREMENT_MS: 100
};

/** shopPortOneCheckout verify 최종 실패 시 에러에 붙는 phase 식별자 */
export const SHOP_PAYMENT_VERIFY_ERROR_PHASE = 'VERIFY_AFTER_PORTONE';

/** 체크아웃·결제 준비 API / 단계별 실패 UX */
export const SHOP_CHECKOUT_ERROR_COPY = {
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  CHECKOUT_FAILED: '체크아웃에 실패했습니다.',
  CHECKOUT_ORDER_ID_MISSING: '주문 번호를 받지 못했습니다. 다시 시도해 주세요.',
  PREPARE_FAILED: '결제 준비에 실패했습니다.',
  PAYMENT_LAUNCH_FAILED:
    '결제 모듈 실행에 실패했습니다. 주문 상세에서 다시 결제를 시도해 주세요.',
  VERIFY_FAILED: '결제 검증에 실패했습니다. 주문 상세에서 상태를 확인해 주세요.',
  VERIFY_FAILED_USE_ORDER_CONFIRM:
    '결제 검증에 실패했습니다. 주문 상세의 「결제 확인」으로 다시 시도해 주세요.',
  INVALID_CASH_AMOUNT: '결제 금액이 올바르지 않습니다.'
};

/** PortOne redirectUrl 복귀 페이지 UX */
export const SHOP_PAYMENT_RETURN_COPY = {
  TITLE: '결제 확인',
  VERIFYING: '결제를 확인하고 있습니다…',
  MISSING_PAYMENT_ID: '결제 식별자가 없습니다. 주문 상세에서 상태를 확인해 주세요.',
  MISSING_AMOUNT: '결제 금액을 확인할 수 없습니다. 주문 상세에서 다시 시도해 주세요.',
  PAID_FULFILLMENT_RETRY:
    '결제는 완료됐지만 이행에 실패했습니다. 재이행을 눌러 주세요.',
  ORDER_LINK: '주문 상세로 이동',
  ORDERS_LINK: '내 구매 목록'
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
  SKU_CARD_THUMBNAIL: 'sku-card-thumbnail',
  ORDER_DETAIL_CONFIRM_PAYMENT: 'client-shop-order-confirm-payment'
};

export const CLIENT_SHOP_SESSION_LOADING_COPY = '불러오는 중…';
