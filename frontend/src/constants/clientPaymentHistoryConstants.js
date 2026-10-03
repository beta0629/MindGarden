/**
 * 내담자 웹 「결제 내역」 — 필터·배지·결제수단·문구 상수
 * 스펙: docs/design/clinic-os-client-payments.md
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import { CLIENT_SHOP_ROUTES } from './clientShopConstants';

/** 공통 리스트 모듈(MGPagination) 한 페이지 행 수 */
export const CLIENT_PAYMENT_HISTORY_PAGE_SIZE = 10;

/** 온라인 주문 목록 서버 page size 상한(백엔드 listMyOrders 최대 50) */
export const CLIENT_PAYMENT_SHOP_ORDERS_FETCH_SIZE = 50;

/** 온라인 주문 끝까지 읽기 안전 상한 (무한 루프 방지) */
export const CLIENT_PAYMENT_SHOP_ORDERS_MAX_PAGES = 20;

/** 표/카드 전환 폭 (≥ 이 값 = 표) */
export const CLIENT_PAYMENT_TABLE_MIN_WIDTH_PX = 768;

export const CLIENT_PAYMENT_QUERY_KEYS = Object.freeze({
  PERIOD: 'period',
  STATUS: 'status',
  PAGE: 'page'
});

export const CLIENT_PAYMENT_PERIOD = Object.freeze({
  ALL: 'all',
  ONE_MONTH: '1m',
  THREE_MONTHS: '3m',
  ONE_YEAR: '1y'
});

/** 기간 프리셋 → 개월 수 (ALL 은 null) */
export const CLIENT_PAYMENT_PERIOD_MONTHS = Object.freeze({
  [CLIENT_PAYMENT_PERIOD.ALL]: null,
  [CLIENT_PAYMENT_PERIOD.ONE_MONTH]: 1,
  [CLIENT_PAYMENT_PERIOD.THREE_MONTHS]: 3,
  [CLIENT_PAYMENT_PERIOD.ONE_YEAR]: 12
});

export const CLIENT_PAYMENT_PERIOD_OPTIONS = Object.freeze([
  { id: CLIENT_PAYMENT_PERIOD.ALL, label: '전체 기간' },
  { id: CLIENT_PAYMENT_PERIOD.ONE_MONTH, label: '최근 1개월' },
  { id: CLIENT_PAYMENT_PERIOD.THREE_MONTHS, label: '3개월' },
  { id: CLIENT_PAYMENT_PERIOD.ONE_YEAR, label: '1년' }
]);

export const CLIENT_PAYMENT_STATUS_FILTER = Object.freeze({
  ALL: 'all',
  COMPLETED: 'completed',
  PENDING: 'pending',
  REFUNDED: 'refunded'
});

export const CLIENT_PAYMENT_STATUS_FILTER_OPTIONS = Object.freeze([
  { id: CLIENT_PAYMENT_STATUS_FILTER.ALL, label: '전체' },
  { id: CLIENT_PAYMENT_STATUS_FILTER.COMPLETED, label: '완료' },
  { id: CLIENT_PAYMENT_STATUS_FILTER.PENDING, label: '대기' },
  { id: CLIENT_PAYMENT_STATUS_FILTER.REFUNDED, label: '환불' }
]);

/** 표시 배지 6종 (§4) */
export const CLIENT_PAYMENT_BADGE = Object.freeze({
  COMPLETED: 'completed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
  PARTIAL_REFUND: 'partial-refund',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
});

export const CLIENT_PAYMENT_BADGE_LABELS = Object.freeze({
  [CLIENT_PAYMENT_BADGE.COMPLETED]: '완료',
  [CLIENT_PAYMENT_BADGE.PENDING]: '대기',
  [CLIENT_PAYMENT_BADGE.REFUNDED]: '환불',
  [CLIENT_PAYMENT_BADGE.PARTIAL_REFUND]: '부분환불',
  [CLIENT_PAYMENT_BADGE.CANCELLED]: '취소',
  [CLIENT_PAYMENT_BADGE.FAILED]: '실패'
});

/** 센터 매핑 결제 상태 원본 → 배지 (§4 FE 매핑) */
export const CLIENT_PAYMENT_MAPPING_STATUS_TO_BADGE = Object.freeze({
  CONFIRMED: CLIENT_PAYMENT_BADGE.COMPLETED,
  PAY: CLIENT_PAYMENT_BADGE.COMPLETED,
  DEP: CLIENT_PAYMENT_BADGE.COMPLETED,
  APPROVED: CLIENT_PAYMENT_BADGE.COMPLETED,
  PENDING: CLIENT_PAYMENT_BADGE.PENDING,
  REJECTED: CLIENT_PAYMENT_BADGE.FAILED,
  REFUNDED: CLIENT_PAYMENT_BADGE.REFUNDED,
  CANCELLED: CLIENT_PAYMENT_BADGE.CANCELLED
});

/** 온라인 주문 상태 원본(ShopClientOrderStatus) → 배지 */
export const CLIENT_PAYMENT_SHOP_STATUS_TO_BADGE = Object.freeze({
  PAID: CLIENT_PAYMENT_BADGE.COMPLETED,
  REFUNDED: CLIENT_PAYMENT_BADGE.REFUNDED,
  CREATED: CLIENT_PAYMENT_BADGE.PENDING,
  PENDING_PAYMENT: CLIENT_PAYMENT_BADGE.PENDING,
  CANCELLED: CLIENT_PAYMENT_BADGE.CANCELLED,
  EXPIRED: CLIENT_PAYMENT_BADGE.CANCELLED
});

/** 필터 칩 → 포함 배지 */
export const CLIENT_PAYMENT_STATUS_FILTER_BADGES = Object.freeze({
  [CLIENT_PAYMENT_STATUS_FILTER.ALL]: null,
  [CLIENT_PAYMENT_STATUS_FILTER.COMPLETED]: [CLIENT_PAYMENT_BADGE.COMPLETED],
  [CLIENT_PAYMENT_STATUS_FILTER.PENDING]: [CLIENT_PAYMENT_BADGE.PENDING],
  [CLIENT_PAYMENT_STATUS_FILTER.REFUNDED]: [
    CLIENT_PAYMENT_BADGE.REFUNDED,
    CLIENT_PAYMENT_BADGE.PARTIAL_REFUND
  ]
});

/** 결제수단 원본 → 1줄 문구 (§5 · 대행사 이름 없음) */
export const CLIENT_PAYMENT_METHOD_LABELS = Object.freeze({
  CARD: '카드',
  CREDIT_CARD: '카드',
  CARD_TERMINAL: '카드',
  DEBIT_CARD: '체크카드',
  BANK_TRANSFER: '계좌이체',
  CASH: '현금',
  OTHER: '기타'
});

/** 온라인 주문 결제수단 (할부 정보 없음 → 「일시불」 붙이지 않음) */
export const CLIENT_PAYMENT_ONLINE_METHOD_KEY = 'CARD';

export const CLIENT_PAYMENT_SOURCE = Object.freeze({
  ONLINE: 'ONLINE',
  MANUAL: 'MANUAL'
});

export const CLIENT_PAYMENT_CHANNEL_LABELS = Object.freeze({
  [CLIENT_PAYMENT_SOURCE.ONLINE]: '온라인',
  [CLIENT_PAYMENT_SOURCE.MANUAL]: '센터 결제'
});

export const CLIENT_PAYMENT_ROW_KIND = Object.freeze({
  MAPPING: 'MAPPING',
  SHOP_ORDER: 'SHOP_ORDER'
});

/** 목록에 보이는 온라인 주문 상태 — 구매 목록과 같은 출처라 상태를 숨기지 않고 배지로 구분한다 */
export const CLIENT_PAYMENT_SHOP_VISIBLE_STATUSES = Object.freeze(
  Object.keys(CLIENT_PAYMENT_SHOP_STATUS_TO_BADGE)
);

export const CLIENT_PAYMENT_COPY = Object.freeze({
  TITLE: '결제 내역',
  ORDERS_LINK: '구매 목록 보기 ›',
  ORDERS_HREF: CLIENT_SHOP_ROUTES.ORDERS,
  SHOP_HREF: CLIENT_SHOP_ROUTES.CATALOG,
  PERIOD_GROUP_LABEL: '기간',
  STATUS_GROUP_LABEL: '상태',
  COL_DATE: '결제일',
  COL_PRODUCT: '상품',
  COL_AMOUNT: '금액',
  COL_METHOD: '결제수단',
  COL_STATUS: '상태',
  CAPTION_PREFIX: '결제 내역',
  CAPTION_SEPARATOR: ' · ',
  COUNT_UNIT: '건',
  SUMMARY_PAID_PREFIX: '결제 ',
  SUMMARY_REFUND_PREFIX: '환불 ',
  SUMMARY_SEPARATOR: ' · ',
  SUMMARY_PARTIAL_SUFFIX: ' (일부)',
  PRODUCT_FALLBACK: '상품 정보 없음',
  EMPTY_DASH: '—',
  WON_SUFFIX: '원',
  SESSIONS_SUFFIX: '회기',
  SESSIONS_REFUND_SUFFIX: ' 환불',
  SESSIONS_JOIN: ' · ',
  METHOD_CHANNEL_JOIN: ' · ',
  SUB_FULL_REFUND: '전액 환불',
  SUB_REFUND_PREFIX: '환불 ',
  SUB_ORIGINAL_PAID_SUFFIX: ' 결제분',
  SUB_OF_PAID_PREFIX: '결제 ',
  SUB_OF_PAID_SUFFIX: ' 중',
  EMPTY_ALL_TITLE: '아직 결제 내역이 없어요',
  EMPTY_ALL_BODY: '회기를 구매하면 결제와 환불 내역을 여기에서 볼 수 있어요.',
  EMPTY_ALL_CTA: '회기 고르기',
  EMPTY_FILTER_TITLE: '조건에 맞는 결제 내역이 없어요',
  EMPTY_FILTER_BODY: '기간이나 상태를 바꿔 보세요.',
  EMPTY_FILTER_CTA: '필터 초기화',
  ERROR_TITLE: '결제 내역을 불러오지 못했어요',
  ERROR_BODY: '잠시 후 다시 시도해 주세요.',
  RETRY: '다시 시도',
  PARTIAL_ERROR: '온라인 결제 내역 일부를 불러오지 못했어요.',
  CENTER_PAYMENTS_NOTE: '센터에서 직접 결제한 내역은 센터에 문의해 주세요.',
  LOADING_LABEL: '결제 내역을 불러오는 중'
});

/** skeleton 행 수 (§7) */
export const CLIENT_PAYMENT_SKELETON_ROWS = 5;
export const CLIENT_PAYMENT_SKELETON_CARDS = 4;

/** 숫자만 있는 문자열 = 상품명 아님 (§6-1) */
export const CLIENT_PAYMENT_NUMERIC_ONLY_PATTERN = /^[-+]?\d+([.,]\d+)?$/;

export const CLIENT_PAYMENT_TEST_IDS = Object.freeze({
  FILTER_BAR: 'client-payment-filter-bar',
  SUMMARY: 'client-payment-summary',
  TABLE: 'client-payment-table',
  CARDS: 'client-payment-cards',
  ROW: 'client-payment-row',
  BADGE: 'client-payment-badge',
  EMPTY: 'client-payment-empty',
  ERROR: 'client-payment-error',
  PARTIAL_ERROR: 'client-payment-partial-error',
  SKELETON: 'client-payment-skeleton',
  PAGINATION: 'client-payment-pagination',
  CENTER_NOTE: 'client-payment-center-note'
});
