/**
 * 내담자 몰 TO-BE (보통 쇼핑몰) — 카피·테스트 ID·동작 상수 SSOT
 * 근거: docs/design/client-mall/clinic-os-client-mall.md §4~§12 (§9 카피는 글자 그대로)
 * 웹·앱이 같은 문구를 쓰도록 UI 로직과 분리한다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from './clientShopConstants';

/** 환불 안내 — 목록·상세·결제 전 확인이 공유하는 단일 문구 */
export const CLIENT_REFUND_NOTICE = '환불 기준과 신청 방법은 센터 환불 규칙에 따라 안내해 드려요.';

/** §9 이용기간 안내 — 목록 배너·장바구니 */
export const CLIENT_MALL_USAGE_BANNER =
  '이용기간 — 상품마다 정한 기간(예: 단회기·10회기 패키지는 결제일부터 3개월) 안에 사용해야 합니다. '
  + '기한이 지나면 남은 회기는 만료되며, 센터 사정에 따라 연장될 수 있어요.';

/** §9 예시 날짜 (배너 둘째 줄) */
export const CLIENT_MALL_USAGE_BANNER_EXAMPLE = '예: 9월 28일 결제 시 12월 28일까지 사용 가능(당일 포함)';

/**
 * §9 이용기간 안내 · 한 상품 (상세 · 결제 전 확인 줄마다 · 완료)
 *
 * @param {number} validityMonths
 * @returns {string}
 */
export const buildClientMallProductUsageNotice = (validityMonths) =>
  `이용기간 — 이 상품은 결제일부터 ${validityMonths}개월 안에 사용해야 합니다. `
  + '기한이 지나면 남은 회기는 만료되며, 센터 사정에 따라 연장될 수 있어요.';

/** 예시 날짜 문장 조각 — 「예: 9월 28일 결제 시 2027년 9월 28일까지 사용 가능(당일 포함)」 */
export const CLIENT_MALL_DATE_COPY = Object.freeze({
  YEAR: '년',
  MONTH: '월',
  DAY: '일',
  EXAMPLE_PREFIX: '예: ',
  EXAMPLE_MIDDLE: ' 결제 시 ',
  EXAMPLE_SUFFIX: '까지 사용 가능(당일 포함)'
});

export const CLIENT_MALL_COPY = Object.freeze({
  PAGE_TITLE: '상담 회기 구매',
  PAGE_SUBTITLE: '상품을 담거나 바로 구매하세요. 결제는 한 화면에서 끝나요.',
  LIST_HEAD_SUFFIX: '개',
  LIST_HEAD_PREFIX: '판매 중인 상품 ',
  LIST_HEAD_HINT: '담은 상품은 오른쪽 장바구니에 모여요',
  EMPTY_TITLE: '지금 구매할 수 있는 상품이 없어요',
  EMPTY_BODY: '센터에 문의해 주세요',
  LOAD_FAILED: '상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  LOGIN_REQUIRED: '장바구니·결제는 로그인 후 이용할 수 있어요.',
  LOGIN_LINK: '로그인',

  SESSION_UNIT: '회기',
  WON_UNIT: '원',
  PER_SESSION_PREFIX: '회당 ',
  ROW_COMPOSITION: '구성',
  ROW_VALIDITY: '이용기간',
  VALIDITY_PREFIX: '결제일부터 ',
  VALIDITY_SUFFIX: '개월',
  ADD_TO_CART: '장바구니 담기',
  BUY_NOW: '바로 구매',

  BEFORE_BUY_TITLE: '구매 전에 알아두세요',
  BEFORE_BUY_SESSIONS_LABEL: '회기 추가',
  BEFORE_BUY_SESSIONS_VALUE: '결제가 끝나면 산 회기가 바로 추가돼요',
  BEFORE_BUY_REFUND_LABEL: '환불',
  BEFORE_BUY_PAYMENT_LABEL: '결제',
  BEFORE_BUY_PAYMENT_VALUE: '카드 결제 · 일시불',

  CART_TITLE: '장바구니',
  CART_COUNT_SUFFIX: '개',
  CART_TOTAL: '합계',
  CART_JUST_ADDED: '방금 담음',
  CART_CHECKOUT: '결제하기',
  CART_EDIT: '장바구니 수정',
  CART_EMPTY_TITLE: '담긴 상품이 없어요',
  CART_EMPTY_BODY: '상품의 「장바구니 담기」를 누르면 여기에 모여요',
  CART_EMPTY_HELP: '상품을 담으면 결제할 수 있어요',
  CART_USE_WITHIN_SUFFIX: '개월 안에 사용',
  CART_ADD_FAILED: '장바구니에 담지 못했어요. 잠시 후 다시 시도해 주세요.',
  CART_REMOVE: '빼기',
  CART_BROWSE: '상품 보러 가기',
  CART_NEXT_HINT: '다음 화면에서 인증·동의 후 바로 결제해요',
  CART_PAGE_SUMMARY_TITLE: '결제 금액',
  CART_PAGE_SUBTITLE: '수량을 바꾸거나 빼고 결제하세요',
  CART_PAGE_LIST_PREFIX: '담은 상품 ',
  CART_PAGE_SESSIONS: '받는 회기',
  CART_PAGE_VALIDITY_SUFFIX: '개월 안에 사용',
  LINE_TIMES: ' × ',
  BAR_LABEL: '장바구니',
  CARD_DESC_FALLBACK_PREFIX: '50분 개인상담 ',
  CARD_DESC_FALLBACK_SUFFIX: '회',
  QTY_DECREASE: '수량 줄이기',
  QTY_INCREASE: '수량 늘리기',

  TOAST_TITLE: '장바구니에 담았어요',
  TOAST_VIEW: '보기',
  TOAST_CART_PREFIX: '장바구니 ',

  DETAIL_BACK: '← 상품 목록',
  DETAIL_ROW_SESSIONS_ADDED_SUFFIX: '가 바로 추가돼요',
  DETAIL_ROW_SESSIONS_ADDED_PREFIX: '결제가 끝나면 ',
  DETAIL_ROW_SESSIONS_ADDED_LABEL: '회기 추가',
  DETAIL_ROW_REFUND_LABEL: '환불',
  DETAIL_NOT_FOUND: '상품을 찾을 수 없거나 지금은 판매하지 않아요.',
  DETAIL_VALIDITY_INCLUSIVE: ' (당일 포함)'
});

/** 결제 전 확인 (§5.8) */
export const CLIENT_MALL_CHECKOUT_COPY = Object.freeze({
  TITLE: '결제 전 확인',
  EYEBROW: '결제 전 확인',
  SUBTITLE: '이 화면에서 확인·인증·동의까지 마치고 바로 결제해요.',
  BUY_NOW_CAPTION: '바로 구매 · 장바구니는 그대로예요',
  CART_CAPTION_PREFIX: '장바구니 ',
  CART_CAPTION_MIXED_SUFFIX: ' · 상품마다 이용기간이 달라요',
  ORDER_SECTION: '주문 상품',
  ROW_SESSIONS: '회기 수',
  ROW_VALIDITY: '이용기간',
  ROW_QUANTITY: '수량',
  BUYER_SECTION: '구매자 정보',
  BUYER_NAME: '이름',
  BUYER_CONSULTANT: '담당 상담사',
  BUYER_PHONE: '휴대폰',
  BUYER_PHONE_CARD_HINT: '이 화면 안에서 인증해요',
  PHONE_NEEDS_VERIFY: '인증이 필요해요',
  PHONE_NEEDS_VERIFY_HINT: '결제 전에 한 번만',
  AGREEMENT_SECTION: '약관 동의',
  AGREEMENT_ALL: '전체 동의',
  AGREEMENT_REQUIRED_TAG: '필수',
  REFUND_SECTION: '환불 규칙 요약',
  POINTS_SECTION: '포인트 사용',
  PAY_SECTION: '결제 금액',
  PAY_ROW_SUBTOTAL: '상품 금액',
  PAY_ROW_POINTS: '포인트',
  PAY_ROW_POINTS_BALANCE_PREFIX: '보유 ',
  PAY_ROW_POINTS_SEPARATOR: ' · ',
  POINT_UNIT: 'P',
  PAY_ROW_SESSIONS: '받는 회기',
  PAY_ROW_QUANTITY: '수량',
  SESSIONS_PLUS_PREFIX: '+',
  PAY_TOTAL: '결제 금액',
  PAY_VALIDITY_PREFIX: '이용기간: 결제일부터 ',
  PAY_VALIDITY_SUFFIX: '개월 (당일 포함)',
  PAY_VALIDITY_MIXED: '이용기간: 상품마다 달라요 · 주문 상품 줄에서 확인',
  PAY_CTA_SUFFIX: ' 결제하기',
  PAY_WINDOW_HINT: '카드 결제창이 열려요',
  BLOCK_BOTH: '휴대폰 인증과 전체 동의 후 결제할 수 있어요',
  BLOCK_PHONE: '휴대폰 인증 후 결제할 수 있어요',
  BLOCK_AGREEMENT: '전체 동의 후 결제할 수 있어요',
  CANCELLED_TITLE: '결제가 취소됐어요',
  CANCELLED_BODY: '주문 내용, 인증, 동의는 그대로예요. 다시 결제할 수 있어요.',
  EMPTY_TITLE: '결제할 상품이 없어요',
  LOAD_FAILED: '결제 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  POINTS_NEGATIVE: '0 이상 입력해 주세요.',
  POINTS_OVER_BALANCE: '보유 포인트를 넘을 수 없어요.',
  POINTS_OVER_SUBTOTAL: '상품 금액을 넘을 수 없어요.'
});

/**
 * 필수 약관 3줄 — 펼침 본문은 기존 법적 고지·환불 공통 문구 재사용.
 * body 는 페이지가 주입(legalPublic)하므로 여기서는 라벨만 둔다.
 */
export const CLIENT_MALL_AGREEMENT_KEYS = Object.freeze({
  PURCHASE: 'purchase',
  USAGE_REFUND: 'usageRefund',
  THIRD_PARTY: 'thirdParty'
});

export const CLIENT_MALL_AGREEMENT_ITEMS = Object.freeze([
  { key: CLIENT_MALL_AGREEMENT_KEYS.PURCHASE, label: '구매 조건 확인 및 결제 진행 동의' },
  { key: CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND, label: '이용기간·환불 규칙 확인' },
  { key: CLIENT_MALL_AGREEMENT_KEYS.THIRD_PARTY, label: '개인정보 제3자 제공 동의 (결제대행)' }
]);

export const CLIENT_MALL_THIRD_PARTY_BODY =
  '결제를 처리하기 위해 결제대행사에 이름·휴대폰 번호·결제 금액이 제공돼요.';

/** 휴대폰 인증 상태 a~g (§8) */
export const CLIENT_MALL_PHONE_COPY = Object.freeze({
  SECTION_LABEL: '휴대폰 인증',
  SECTION_HINT: '결제 전에 한 번만 인증해요. 입력한 내용은 그대로 남아요.',
  START: '인증하기',
  SHEET_TITLE: '휴대폰 인증',
  SHEET_SENT_SUBTITLE: '문자로 받은 6자리 숫자를 입력해 주세요.',
  SENT_HELP: '문자가 안 오면 다시 받을 수 있어요',
  RESENT_HELP: '새 인증번호만 쓸 수 있어요',
  CLOSE: '닫기',
  VERIFIED_TOAST: '인증을 마쳤어요',
  PHONE_INPUT_LABEL: '휴대폰 번호',
  PHONE_PLACEHOLDER: '010-0000-0000',
  SEND: '인증번호 받기',
  SEND_HINT: '입력한 번호로 인증번호를 보내요',
  SENT_SUFFIX: '로 보냈어요',
  RESENT_SUFFIX: '로 다시 보냈어요',
  SENT_PUSH: '앱 알림으로 인증번호를 보냈어요',
  CHANGE_NUMBER: '번호 변경',
  CODE_LABEL: '인증번호 6자리',
  CODE_PLACEHOLDER: '000000',
  TIMER_SUFFIX: ' 남음',
  CONFIRM: '확인',
  RESEND: '다시 받기',
  RESEND_WAIT_SEPARATOR: ' · ',
  RESEND_WAIT_SUFFIX: '초',
  WRONG_CODE: '인증번호가 맞지 않아요. 다시 입력해 주세요.',
  WRONG_CODE_ATTEMPTS_PREFIX: ' (남은 횟수 ',
  WRONG_CODE_ATTEMPTS_SUFFIX: '회)',
  EXPIRED_TITLE: '인증 시간이 지났어요',
  EXPIRED_BODY: '인증번호를 다시 받아 주세요.',
  LOCKED_TITLE: '인증 시도 횟수를 넘었어요',
  LOCKED_BODY_MINUTES_SUFFIX: '분 뒤에 다시 시도해 주세요. 담은 상품과 동의 내용은 그대로 있어요.',
  LOCKED_BODY_FALLBACK: '잠시 뒤에 다시 시도해 주세요. 담은 상품과 동의 내용은 그대로 있어요.',
  VERIFIED_PREFIX: '인증 완료 · ',
  CHANGE: '변경',
  SEND_FAILED: '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
  INVALID_PHONE: '휴대폰 번호를 확인해 주세요.',
  CONFIRM_FAILED: '인증을 마치지 못했어요. 잠시 후 다시 시도해 주세요.'
});

/** 결제 완료 (§5.10) */
export const CLIENT_MALL_COMPLETE_COPY = Object.freeze({
  TITLE: '결제 완료',
  EYEBROW: '결제 완료',
  HEADING: '결제가 완료됐어요',
  SESSIONS_ADDED_SUFFIX: '회기가 추가됐어요.',
  ROW_PRODUCT: '상품',
  ROW_SESSIONS: '추가된 회기',
  ROW_EXPIRE: '사용 기한',
  ROW_AMOUNT: '결제 금액',
  AMOUNT_METHOD_SUFFIX: ' · 카드 결제 · 일시불',
  AMOUNT_POINTS_ONLY_SUFFIX: ' · 포인트 결제',
  ASIDE_TITLE: '내 회기',
  ASIDE_REMAINING_LABEL: '남은 회기',
  ASIDE_REMAINING_UNIT: '회',
  ASIDE_EXPIRE_SUFFIX: '까지 사용 (당일 포함)',
  ROW_ORDER_ID: '주문번호',
  EXPIRE_SUFFIX: '까지 (당일 포함)',
  PRIMARY: '내 회기 보기',
  SECONDARY: '결제 내역 보기',
  HELP: '상담 일정은 센터에서 연락드려요',
  BUY_NOW_CART_KEPT_PREFIX: '바로 구매였기 때문에 장바구니(',
  BUY_NOW_CART_KEPT_SUFFIX: '개)는 그대로 남아요',
  LOAD_FAILED: '주문 정보를 불러오지 못했어요.',
  ORDER_LINK: '주문 상세 보기'
});

export const CLIENT_MALL_ROUTES = Object.freeze({
  SESSIONS: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  PAYMENT_HISTORY: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  SETTINGS: CLIENT_DASHBOARD_ROUTES.SETTINGS,
  CHECKOUT: CLIENT_SHOP_ROUTES.CHECKOUT
});

/** 쿼리 키 */
export const CLIENT_MALL_QUERY = Object.freeze({
  MODE: 'mode',
  MODE_BUY_NOW: 'buyNow',
  SKU: 'sku',
  QTY: 'qty',
  RETURN_TO: 'returnTo'
});

export const CLIENT_MALL_TIMING = Object.freeze({
  TOAST_MS: 3000,
  BADGE_PULSE_MS: 600,
  COUNTDOWN_TICK_MS: 1000,
  MS_PER_SECOND: 1000
});

export const CLIENT_MALL_LIMITS = Object.freeze({
  OTP_LENGTH: 6,
  PHONE_DIGITS_MAX: 11,
  QTY_MIN: 1,
  QTY_MAX: 99
});

/** HTTP 상태 — 인증 시도 초과 판정 */
export const CLIENT_MALL_HTTP_TOO_MANY_REQUESTS = 429;

/** BE·PG 최소 카드 결제 금액 오류 문구 식별 조각 */
export const CLIENT_MALL_MIN_AMOUNT_ERROR_MARKERS = Object.freeze(['최소 금액', '카드 결제는']);

/** BE 가 OTP 불일치·만료 시 내려주는 문구 식별 조각 */
export const CLIENT_MALL_OTP_MISMATCH_MARKER = '인증 코드';

/** 주문 생성 경로 — BE ShopCheckoutConstants.CHECKOUT_SOURCE_BUY_NOW */
export const CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW = 'BUY_NOW';

/** 좁은 웹(<900px) — ClientMall.css 하단 바·인증 시트 전환점과 같은 값 */
export const CLIENT_MALL_NARROW_MEDIA_QUERY = '(max-width: 56.25rem)';

export const CLIENT_MALL_TEST_IDS = Object.freeze({
  CATALOG_GRID: 'client-mall-grid',
  CATALOG_EMPTY: 'client-mall-empty',
  LIST_HEAD: 'client-mall-list-head',
  USAGE_BANNER: 'client-mall-usage-banner',
  BEFORE_BUY: 'client-mall-before-buy',
  PRODUCT_CARD: 'client-mall-product-card',
  CARD_ADD: 'client-mall-card-add',
  CARD_BUY_NOW: 'client-mall-card-buy-now',
  CART_SUMMARY: 'client-mall-cart-summary',
  CART_SUMMARY_CHECKOUT: 'client-mall-cart-summary-checkout',
  CART_BAR: 'client-mall-cart-bar',
  CART_BAR_CHECKOUT: 'client-mall-cart-bar-checkout',
  TOAST: 'client-mall-toast',
  CHECKOUT_LINE: 'client-mall-checkout-line',
  CHECKOUT_LINE_NOTICE: 'client-mall-checkout-line-notice',
  CHECKOUT_PAY: 'client-mall-checkout-pay',
  CHECKOUT_BLOCK_REASON: 'client-mall-checkout-block-reason',
  CHECKOUT_CANCELLED: 'client-mall-checkout-cancelled',
  CHECKOUT_AGREE_ALL: 'client-mall-agree-all',
  CHECKOUT_REFUND: 'client-mall-checkout-refund',
  PHONE_VERIFY: 'client-mall-phone-verify',
  PHONE_SEND: 'client-mall-phone-send',
  PHONE_CODE: 'client-mall-phone-code',
  PHONE_CONFIRM: 'client-mall-phone-confirm',
  PHONE_RESEND: 'client-mall-phone-resend',
  PHONE_TIMER: 'client-mall-phone-timer',
  PHONE_ERROR: 'client-mall-phone-error',
  PHONE_VERIFIED: 'client-mall-phone-verified',
  PHONE_SHEET: 'client-mall-phone-sheet',
  PHONE_OPEN: 'client-mall-phone-open',
  CART_PAGE_ASIDE: 'client-mall-cart-page-aside',
  COMPLETE_ASIDE: 'client-mall-complete-aside',
  COMPLETE_CART_KEPT: 'client-mall-complete-cart-kept',
  COMPLETE: 'client-mall-complete',
  COMPLETE_PRIMARY: 'client-mall-complete-primary'
});
