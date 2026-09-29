/**
 * 관리자 쇼핑 스위트 (온라인 주문·상품·리워드·결제 연결) — 카피·세그먼트·상태 상수
 * 스펙: clinic-os-admin-shop-suite v2 (돈·회기 쌍장부)
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import { ADMIN_ROUTES } from './adminRoutes';

/** 상품 라우트 — `:id` 는 패키지 코드(codeValue) 또는 공통코드 id */
export const ADMIN_SHOP_PRODUCT_ROUTES = Object.freeze({
  LIST: ADMIN_ROUTES.SHOP_PRODUCTS,
  NEW: `${ADMIN_ROUTES.SHOP_PRODUCTS}/new`
});

/**
 * @param {string|number} id 패키지 코드 또는 공통코드 id
 * @returns {string}
 */
export function buildAdminShopProductEditRoute(id) {
  return `${ADMIN_ROUTES.SHOP_PRODUCTS}/${encodeURIComponent(String(id))}/edit`;
}

/** 목록 한 페이지 행 수 */
export const ADMIN_SHOP_SUITE_PAGE_SIZE = 20;

/** 주문 목록 1회 조회 건수 — 기간·세그먼트는 클라이언트에서 거른다 */
export const ADMIN_SHOP_ORDERS_FETCH_SIZE = 100;

/** 주문 행 상세(상품·회기) 보강 동시 호출 수 */
export const ADMIN_SHOP_ORDER_ENRICH_CONCURRENCY = 4;

/** 토스트 노출 시간(ms) */
export const ADMIN_SHOP_TOAST_DURATION_MS = 4000;

/** 짧은 주문번호 — 앞·뒤 글자 수 */
export const ADMIN_SHOP_ORDER_SHORT_ID_SEGMENT = 4;

/** 몰 설명 최대 글자 수 */
export const ADMIN_SHOP_PRODUCT_DESCRIPTION_MAX = 500;

/** 회기 수 최소값(저장 가능) */
export const ADMIN_SHOP_PRODUCT_SESSION_MIN = 1;

/** 금액 입력 — 퍼센트 ↔ basis points */
export const ADMIN_SHOP_BPS_PER_PERCENT = 100;

/** 쌍장부 행 상태 */
export const ADMIN_SHOP_LEDGER_STATE = Object.freeze({
  PAID: 'PAID',
  PENDING: 'PENDING',
  RECONCILE: 'RECONCILE',
  REFUNDED: 'REFUNDED',
  EXPIRED: 'EXPIRED'
});

/** 상태 칩 — 녹색 없음. variant 는 StatusBadge, modifier 는 스위트 토큰 */
export const ADMIN_SHOP_LEDGER_CHIP = Object.freeze({
  [ADMIN_SHOP_LEDGER_STATE.PAID]: { label: '결제 완료', variant: 'neutral', modifier: 'paid' },
  [ADMIN_SHOP_LEDGER_STATE.PENDING]: { label: '결제 대기', variant: 'warning', modifier: 'amber' },
  [ADMIN_SHOP_LEDGER_STATE.RECONCILE]: { label: '정합 필요', variant: 'warning', modifier: 'amber' },
  [ADMIN_SHOP_LEDGER_STATE.REFUNDED]: { label: '환불 완료', variant: 'info', modifier: 'refunded' },
  [ADMIN_SHOP_LEDGER_STATE.EXPIRED]: { label: '미결제 · 시간 초과', variant: null, modifier: 'expired' }
});

/** 주문 목록 세그먼트 */
export const ADMIN_SHOP_ORDER_SEGMENTS = Object.freeze([
  { value: 'ALL', label: '전체' },
  { value: ADMIN_SHOP_LEDGER_STATE.PAID, label: '결제 완료' },
  { value: ADMIN_SHOP_LEDGER_STATE.PENDING, label: '결제 대기' },
  { value: ADMIN_SHOP_LEDGER_STATE.RECONCILE, label: '정합 필요' },
  { value: ADMIN_SHOP_LEDGER_STATE.REFUNDED, label: '환불 완료' },
  { value: ADMIN_SHOP_LEDGER_STATE.EXPIRED, label: '미결제' }
]);

/** 주문 기간 필터 */
export const ADMIN_SHOP_ORDER_PERIOD = Object.freeze({
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  LAST_3_MONTHS: 'LAST_3_MONTHS',
  ALL: 'ALL'
});

export const ADMIN_SHOP_ORDER_PERIOD_OPTIONS = Object.freeze([
  { value: ADMIN_SHOP_ORDER_PERIOD.THIS_MONTH, label: '이번 달' },
  { value: ADMIN_SHOP_ORDER_PERIOD.LAST_MONTH, label: '지난 달' },
  { value: ADMIN_SHOP_ORDER_PERIOD.LAST_3_MONTHS, label: '최근 3개월' },
  { value: ADMIN_SHOP_ORDER_PERIOD.ALL, label: '전체 기간' }
]);

/** 삭제 가능(목록 ⋯) — 미결제(결제 시간 초과)·환불 완료만 */
export const ADMIN_SHOP_ORDER_DELETE_VISIBLE_STATES = Object.freeze([
  ADMIN_SHOP_LEDGER_STATE.EXPIRED,
  ADMIN_SHOP_LEDGER_STATE.REFUNDED
]);

export const ADMIN_SHOP_ORDERS_COPY = Object.freeze({
  TITLE: '온라인 주문',
  SUBTITLE: '결제되면 회기가 붙고, 환불하면 회기가 빠져요.',
  PERIOD_LABEL: '기간',
  CSV: 'CSV 내보내기',
  RELOAD_ARIA: '표 다시 불러오기',
  RELOADED_TOAST: '목록을 다시 불러왔어요',
  STRIP_IN_LABEL: '들어온 돈 · 결제 완료',
  STRIP_OUT_LABEL: '나간 돈 · 환불',
  STRIP_CHECK_LABEL: '확인할 주문',
  STRIP_IN_CAPTION: '건 · 포인트 사용',
  STRIP_OUT_CAPTION: '건 · PortOne 취소 완료',
  STRIP_CHECK_CAPTION_PENDING: '결제 대기',
  STRIP_CHECK_CAPTION_RECONCILE: '정합 필요',
  STRIP_CHECK_VIEW: '보기',
  SEGMENT_ARIA: '주문 상태',
  SEARCH_PLACEHOLDER: '주문번호·내담자 검색',
  SEARCH_ARIA: '주문 검색',
  COL_ORDERED_AT: '주문 일시',
  COL_ORDER_NO: '주문번호',
  COL_CLIENT: '내담자',
  COL_PRODUCT: '상품',
  COL_SESSIONS: '회기',
  COL_AMOUNT: '결제 금액',
  COL_POINTS: '포인트',
  COL_STATUS: '상태',
  COL_MENU: '메뉴',
  TOTAL_LABEL: '이 기간 합계',
  TOTAL_CAPTION: '결제 완료·환불만 합산 · 결제 대기·정합 필요·미결제 제외',
  SESSION_UNIT: '회기',
  SESSION_GRANTED: '회기',
  SESSION_RESTORED: '원복',
  SESSION_WAITING: '대기',
  SESSION_UNREFLECTED: '미반영',
  MENU_DETAIL: '주문 상세',
  MENU_COPY_ID: '주문번호 복사',
  MENU_DELETE: '주문 기록 삭제',
  COPIED_TOAST: '주문번호를 복사했어요',
  EMPTY_TITLE_PERIOD: '이 기간에는 온라인 주문이 없어요',
  EMPTY_DESC: '몰 노출 상품이 있어야 내담자가 결제할 수 있어요.',
  EMPTY_ACTION: '상품 보러 가기',
  EMPTY_FILTERED: '조건에 맞는 주문이 없어요',
  CSV_FILENAME_PREFIX: 'online-orders',
  CSV_HEADERS: ['주문 일시', '주문번호', '내담자', '상품', '회기', '결제 금액', '포인트', '상태'],
  AMOUNT_TITLE_SEPARATOR: ' · ',
  LOAD_FAILED_TITLE: '주문을 불러오지 못했어요.',
  LOAD_FAILED_DESC: '네트워크를 확인하고 다시 시도하세요.',
  RETRY: '다시 시도',
  DELETE_TITLE: '주문 기록을 삭제할까요?',
  DELETE_IMPACT: '결제되지 않은 기록이라 회기·돈에는 영향이 없어요. 목록에서만 사라져요.',
  DELETE_CONFIRM: '삭제',
  DELETE_DONE: '주문 기록을 삭제했어요',
  DELETE_FAILED: '주문 기록을 삭제하지 못했어요.',
  PAGINATION_UNIT: '건'
});

export const ADMIN_SHOP_ORDER_MODAL_COPY = Object.freeze({
  TITLE: '주문 상세',
  PAIR_AMOUNT: '결제 금액',
  PAIR_SESSIONS: '회기',
  SESSION_GRANTED_SUFFIX: '회기 부여',
  SESSION_WAITING_SUFFIX: '미반영',
  SESSION_RESTORED_SUFFIX: '회기 원복',
  COPY: '복사',
  CONSULTANT: '담당 상담사',
  MAPPING: '배정',
  PAY_METHOD: '결제 수단',
  EXPIRES_AT: '사용 기한',
  EXPIRES_AT_VALUE: '{date}까지',
  EXTEND_INFO: '{count}회 연장 · 원래 {date}',
  PAID_AT: '결제 일시',
  LINES_HINT: '회기 상품 · 줄 금액',
  LINE_COL_PRODUCT: '상품',
  LINE_COL_SESSIONS: '회기',
  LINE_COL_QTY: '수량',
  LINE_COL_AMOUNT: '금액',
  EVENTS_TITLE: '처리 기록',
  EVENTS_HINT: '결제 · 회기 · 회계',
  USED_WARNING_LEAD: '이미 쓴 {usedCount}회도 함께 빠져요.',
  USED_WARNING_TAIL: '환불 후 남는 회기는 0회예요.',
  RECONCILE_BOX: '환불 정합을 누르면 PortOne 결제 상태를 다시 읽고 회기를 맞춰요.',
  FORCE_RECONCILE_LINK: '강제 정합…',
  CLOSE: '닫기',
  REFUND_OUTLINE: '전액 환불',
  REFUND_FAILED_TITLE: '환불하지 못했어요.',
  REFUND_FAILED_TAIL: '돈과 회기는 바뀌지 않았어요.',
  REFUND_FAILED_ACTION: '환불 정합으로 확인',
  EMPTY_VALUE: '—'
});

export const ADMIN_SHOP_REFUND_CONFIRM_COPY = Object.freeze({
  TITLE: '전액 환불할까요?',
  SUBTITLE: '되돌릴 수 없어요. PortOne 취소가 바로 실행돼요.',
  PAIR_AMOUNT: '환불 금액',
  PAIR_SESSIONS: '회기 원복',
  USED_CAPTION: '이미 쓴 {usedCount}회 포함 · 남는 회기 0회',
  REASON_LABEL: '환불 사유',
  REASON_PLACEHOLDER: '사유를 고르세요',
  USED_CHECK: '이미 쓴 {usedCount}회도 함께 빠지는 것을 확인했어요',
  CANCEL: '취소',
  SUBMIT_SUFFIX: '환불',
  SUCCESS: '전액 환불했어요'
});

/** 결제 수단 코드 → 한글 (PortOne method) */
export const ADMIN_SHOP_PAY_METHOD_LABELS = Object.freeze({
  CARD: '신용카드',
  CREDIT_CARD: '신용카드',
  EASY_PAY: '간편결제',
  TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
  POINTS: '포인트'
});

/** 주문 처리 기록 — 이행 이벤트 상태 → 한글 이벤트 */
export const ADMIN_SHOP_ORDER_EVENT_LABELS = Object.freeze({
  COMPLETED: '회기 부여',
  SUCCESS: '회기 부여',
  FAILED: '회기 부여 실패',
  PENDING: '회기 부여 대기',
  SKIPPED: '건너뜀'
});

export const ADMIN_SHOP_PRODUCT_SEGMENT = Object.freeze({
  ALL: 'ALL',
  ON_SALE: 'ON_SALE',
  STOPPED: 'STOPPED'
});

export const ADMIN_SHOP_PRODUCT_SEGMENTS = Object.freeze([
  { value: ADMIN_SHOP_PRODUCT_SEGMENT.ALL, label: '전체' },
  { value: ADMIN_SHOP_PRODUCT_SEGMENT.ON_SALE, label: '판매 중' },
  { value: ADMIN_SHOP_PRODUCT_SEGMENT.STOPPED, label: '판매 중지' }
]);

/** 상품 구분 필터 — 전체 */
export const ADMIN_SHOP_PRODUCT_CATEGORY_ALL = 'ALL';

export const ADMIN_SHOP_PRODUCTS_COPY = Object.freeze({
  TITLE: '상품',
  SUBTITLE: '온라인 판매 상품과 판매 중지 상품을 한곳에서. 회기 수는 결제되면 내담자에게 붙는 횟수예요.',
  CREATE: '＋ 상품 등록',
  CREATE_FIRST: '＋ 첫 상품 등록',
  SEGMENT_ARIA: '상품 판매 상태',
  SEARCH_PLACEHOLDER: '상품명·코드 검색',
  SEARCH_ARIA: '상품 검색',
  COL_NAME: '상품명',
  COL_STATUS: '상태',
  STATUS_ON_SALE: '판매 중',
  STATUS_STOPPED: '판매 중지',
  STOPPED_GROUP: '판매 중지 {stoppedCount}개',
  STOPPED_GROUP_TAIL: '— 기존 구매분은 유지돼요',
  STOPPED_BLOCKED_HINT: '판매 중지 상품은 켤 수 없어요',
  COL_SESSIONS: '회기',
  COL_PRICE: '가격',
  COL_PER_SESSION: '회당',
  COL_HOME: '홈 공개',
  COL_MALL: '몰 노출',
  COL_CONTENT: '몰 내용',
  COL_MENU: '메뉴',
  SESSION_UNIT: '회기',
  SESSION_UNSET: '회기 미설정',
  CONTENT_READY: '등록됨',
  CONTENT_EDIT: '내용 등록',
  MALL_BLOCKED_HINT: '회기 수를 넣으면 켤 수 있어요',
  MENU_EDIT: '수정',
  MENU_STOP: '판매 중지',
  MALL_ON_TOAST: '몰 노출을 켰어요',
  MALL_OFF_TOAST: '몰 노출을 껐어요',
  HOME_ON_TOAST: '홈 공개를 켰어요',
  HOME_OFF_TOAST: '홈 공개를 껐어요',
  UNDO: '되돌리기',
  TOGGLE_FAILED: '노출 설정을 바꾸지 못했어요.',
  STOP_TITLE: '‘{productName}’을(를) 판매 중지할까요?',
  STOP_IMPACT: '판매 중지하면 홈·몰에서 숨겨지고, 기존 구매분은 유지돼요.',
  STOP_CONFIRM: '판매 중지',
  STOP_DONE: '판매를 중지했어요',
  STOPPED_LABEL: '판매 중지',
  EMPTY_TITLE: '아직 상품이 없어요',
  EMPTY_DESC: '상품명·가격·회기 수만 있으면 바로 몰에 올릴 수 있어요.',
  EMPTY_FILTERED: '조건에 맞는 상품이 없어요',
  LOAD_FAILED_TITLE: '상품을 불러오지 못했어요.',
  PAGINATION_UNIT: '개',
  USAGE_PERIOD_NOTICE: '이용기간 — 단회기와 10회기 패키지 모두 결제일부터 3개월 안에 사용해야 합니다. 무제한 유효기간은 없습니다.',
  USAGE_PERIOD_EXPIRY_NOTE: '기한이 지나면 남은 회기는 만료되며, 센터 사정에 따라 연장될 수 있어요.'
});

export const ADMIN_SHOP_PRODUCT_EDITOR_COPY = Object.freeze({
  TITLE_NEW: '상품 등록',
  SUBTITLE_NEW: '가격·회기 수를 먼저 넣고, 몰 내용은 나중에 채워도 돼요.',
  LIST: '목록',
  SAVE: '저장',
  SUBTITLE_EDIT: '온라인 판매 상품 · {code}',
  MENU_ARIA: '상품 메뉴',
  MENU_STOP: '판매 중지',
  SECTION_PRICE: '가격·회기',
  SECTION_PRICE_HINT: '결제 = 회기 부여의 기준',
  SESSIONS: '회기 수',
  SESSIONS_HINT: '결제되면 이 수만큼 회기가 붙어요',
  SESSIONS_ERROR: '회기 수는 1 이상이어야 저장돼요.',
  SESSIONS_DEC: '회기 수 줄이기',
  SESSIONS_INC: '회기 수 늘리기',
  PRICE: '가격',
  PRICE_HINT: '부가세 포함 판매가',
  PRICE_ERROR: '가격을 0원 이상으로 넣어 주세요.',
  PER_SESSION: '회당 단가',
  PER_SESSION_HINT: '자동 계산',
  SECTION_BASIC: '기본 정보',
  NAME: '상품명',
  NAME_ERROR: '상품명을 넣어 주세요.',
  CATEGORY: '구분',
  FIELD_MULTI_HINT: '하나 선택',
  CONSULTANT: '상담 선생님',
  CONSULTANT_PLACEHOLDER: '선생님 선택',
  CODE: '상품 코드',
  CODE_AUTO: '저장하면 자동으로 만들어져요',
  SECTION_MALL: '몰 내용',
  SECTION_MALL_HINT: '내담자 몰 상품 카드에 보여요',
  DESCRIPTION: '설명',
  PREVIEW_EYEBROW: '내담자 결제 미리보기',
  PREVIEW_PRICE: '가격',
  PREVIEW_SESSIONS: '회기',
  PREVIEW_PER_SESSION: '회당',
  FLOW_PAY: '결제 시',
  FLOW_PAY_NOTE: '내담자 회기',
  FLOW_REFUND: '환불 시',
  FLOW_REFUND_NOTE: 'PortOne 취소 · 회기 원복',
  FLOW_POINTS: '포인트',
  FLOW_POINTS_NOTE: '리워드 정책 적립',
  TOGGLE_HOME: '홈 공개',
  TOGGLE_HOME_HINT: '센터 홈 상품 안내에 보여요',
  TOGGLE_MALL: '몰 노출',
  TOGGLE_MALL_HINT: '내담자 몰에서 결제 가능',
  TOGGLE_ACTIVE: '판매 중',
  TOGGLE_ACTIVE_HINT: '끄면 판매 중지 · 기존 구매분은 유지돼요',
  MALL_NEEDS_IMAGE: '몰에 노출하려면 대표 이미지를 올려 주세요.',
  LEAVE_TITLE: '저장하지 않은 변경이 있어요',
  LEAVE_MESSAGE: '목록으로 나가면 바꾼 내용이 사라져요.',
  LEAVE_CONFIRM: '나가기',
  LEAVE_CANCEL: '계속 편집',
  SAVED: '상품을 저장했어요',
  SAVE_FAILED: '상품을 저장하지 못했어요.',
  NOT_FOUND: '상품을 찾을 수 없어요.',
  UPDATED_AT_PREFIX: '마지막 수정'
});

export const ADMIN_SHOP_REWARD_COPY = Object.freeze({
  TITLE: '리워드 정책',
  SUBTITLE: '결제 금액에 따라 포인트를 쌓고 쓰는 규칙이에요. 모든 변경은 저장해야 반영돼요.',
  CHANGES: '변경 사항 {count}개',
  REVERT: '되돌리기',
  SAVE: '저장',
  SAVED: '리워드 정책을 저장했어요',
  SAVE_FAILED: '리워드 정책을 저장하지 못했어요.',
  EARN_TITLE: '쌓기',
  EARN_HINT: '결제 완료 시 적립',
  EARN_RATE: '적립률',
  EARN_RATE_HINT: '결제 금액의 몇 %를 쌓을지 · 0이면 적립 안 함',
  EARN_RATE_ERROR: '적립률은 0~100% 사이로 넣어 주세요.',
  EARN_CAP: '주문당 적립 상한',
  EARN_CAP_HINT: '0이면 상한 없음',
  CLAWBACK: '환불 시 적립 회수',
  CLAWBACK_HINT: '환불하면 쌓인 포인트도 돌아가요 · 항상 적용',
  SPEND_TITLE: '쓰기',
  SPEND_HINT: '내담자 결제 화면',
  MIN_ORDER: '최소 주문액',
  MIN_ORDER_HINT: '0이면 조건 없음',
  MAX_REDEEM: '주문당 최대 사용',
  MAX_REDEEM_HINT: '0이면 제한 없음',
  PG_MIX: '포인트 + 카드 함께 결제',
  PG_MIX_HINT: '일부만 포인트로',
  POINTS_ONLY: '포인트로 전액 결제',
  POINTS_ONLY_HINT: '카드 없이 결제 완료',
  HOLD_TTL: '결제 대기 유지',
  HOLD_TTL_HINT: '시간이 지나면 미결제로 끝나요',
  HOLD_TTL_UNIT: '분',
  HOLD_TTL_ERROR: '결제 대기 유지는 1분 이상이어야 해요.',
  AMOUNT_ERROR: '0 이상의 숫자로 넣어 주세요.',
  EXAMPLE_EYEBROW: '계산 예시 · 저장 전 값',
  EXAMPLE_TITLE_SUFFIX: '결제 시',
  EXAMPLE_TITLE_FALLBACK: '상품 결제 시',
  EXAMPLE_PRICE: '상품 가격',
  EXAMPLE_LIMIT: '포인트 사용 한도',
  EXAMPLE_LIMIT_NONE: '제한 없음',
  EXAMPLE_LIMIT_BLOCKED: '사용 안 함',
  EXAMPLE_USED: '이번 결제에 쓴 포인트',
  EXAMPLE_PAY: '실결제',
  EXAMPLE_EARN: '쌓이는 포인트',
  EXAMPLE_SESSIONS: '회기',
  EXAMPLE_SESSIONS_CAPTION: '상품 기준',
  EXAMPLE_CAP_APPLIED: '상한 적용',
  EXAMPLE_RATE_CHANGE: '적립률이 {from} → {to}로 바뀌어요.',
  POINT_UNIT: 'P'
});

export const ADMIN_SHOP_PG_HISTORY_PREVIEW = 5;

export const ADMIN_SHOP_PG_BADGE = Object.freeze({
  ACTIVE: '사용중',
  PENDING: '승인 대기',
  REJECTED: '거부',
  INACTIVE: '사용 안 함'
});

export const ADMIN_SHOP_PG_COPY = Object.freeze({
  TITLE: '결제 연결',
  SUBTITLE_PORTONE: '카드·간편결제 · 포트원 V2 · 운영 승인 후 사용',
  PROVIDER_PORTONE: '포트원 V2',
  LIST_SUBTITLE: '결제 연결이 2건 이상일 때 여기서 고릅니다.',
  SMOKE_OPEN: '테스트 결제창 열기',
  SMOKE_ORDER_NAME: '포트원 테스트 결제',
  SMOKE_RESULT_TITLE: '테스트 결제창 결과',
  SMOKE_NEEDS_ACTIVE: '운영 승인 후 사용중이 되어야 열 수 있어요.',
  TEST_CONNECTION: '연결 시험',
  EDIT: '수정',
  EDIT_LOCKED: '승인 후에는 수정 시 재승인이 필요해요.',
  MENU_ARIA: '결제 연결 더보기',
  MENU_LIST: '목록 보기',
  MENU_KEYS: '키 확인',
  MENU_DELETE: '삭제',
  KEY_CHANNEL: '채널 키',
  KEY_TEST_CHIP: '테스트',
  KEY_LIVE_MISSING: '운영 채널 키 미입력 · 실결제 전 필요',
  KEY_LIVE_READY: '운영 채널 키 입력됨',
  KEY_STORE: '스토어 ID',
  KEY_STORE_HINT: '포트원 상점 식별',
  KEY_TEST_MODE: '테스트 모드',
  TEST_MODE_ON: '켜짐 · 테스트 결제만',
  TEST_MODE_OFF: '꺼짐 · 실결제',
  TEST_MODE_ON_HINT: '끄면 운영 채널 키·운영 시크릿이 필수가 돼요',
  TEST_MODE_OFF_HINT: '실제 결제가 이뤄져요',
  INFO_TITLE: '연결 정보',
  INFO_HINT: '승인 후에는 수정 시 재승인',
  INFO_PROVIDER: 'PG사',
  INFO_NAME: '표시 이름',
  INFO_MERCHANT: '가맹점 ID',
  INFO_API_SECRET: 'API 시크릿',
  INFO_API_SECRET_VALUE: '•••• 암호화 저장',
  INFO_CHANNEL_TEST: '채널 키 · 테스트',
  INFO_CHANNEL_LIVE: '채널 키 · 운영',
  INFO_CREATED: '등록',
  INFO_NOTES: '비고',
  INFO_MISSING: '미입력',
  KEYS_API: 'API 키',
  KEYS_SECRET: '시크릿 키',
  KEYS_COPY: '복사',
  KEYS_HIDE: '숨기기',
  KEYS_COPIED: '복사했어요',
  KEYS_DECRYPTED_AT: '확인 시각',
  URL_WEBHOOK: '웹훅 URL',
  URL_RETURN: '결제 완료 URL',
  URL_CANCEL: '결제 취소 URL',
  WEBHOOK_TITLE: '웹훅 시크릿',
  WEBHOOK_HINT: '결제 결과 자동 반영에 필요',
  WEBHOOK_SET: '설정됨',
  WEBHOOK_UNSET: '미설정',
  WEBHOOK_PLACEHOLDER: '포트원 콘솔 › 웹훅에서 복사한 시크릿',
  WEBHOOK_PLACEHOLDER_REPLACE: '새 시크릿을 넣으면 교체돼요',
  WEBHOOK_SAVE: '저장',
  WEBHOOK_NOTICE: '승인 상태는 바뀌지 않아요. 비워 두면 결제 후 정합 필요 주문이 늘어나요.',
  WEBHOOK_EMPTY: '웹훅 시크릿을 넣어 주세요.',
  WEBHOOK_SAVED: '웹훅 시크릿을 저장했어요',
  WEBHOOK_FAILED: '웹훅 시크릿을 저장하지 못했어요.',
  STATUS_TITLE: '연결 상태',
  STATUS_LAST: '마지막 연결 시험',
  STATUS_AT: '시각',
  STATUS_RESULT: '결과',
  STATUS_OK: '성공',
  STATUS_FAIL: '실패',
  STATUS_NONE: '아직 시험하지 않았어요',
  APPROVAL_TITLE: '운영 승인',
  APPROVAL_STATE: '상태',
  APPROVAL_BY: '승인자',
  APPROVAL_AT: '시각',
  APPROVAL_REQUESTED_AT: '요청 시각',
  APPROVAL_REASON: '거부 사유',
  APPROVAL_LABELS: Object.freeze({ PENDING: '승인 대기', APPROVED: '승인됨', REJECTED: '거부' }),
  CHECKLIST_TITLE: '실결제로 바꾸려면',
  CHECKLIST_LIVE_KEY: '운영 채널 키 입력',
  CHECKLIST_WEBHOOK: '웹훅 시크릿 저장',
  CHECKLIST_TEST_OFF: '테스트 모드 끄고 재승인',
  CHECKLIST_DONE: '완료',
  CHECKLIST_NEEDED: '필요',
  CHECKLIST_WAIT: '대기',
  HISTORY_TITLE: '변경 이력',
  HISTORY_AT: '일시',
  HISTORY_BY: '변경자',
  HISTORY_ITEM: '항목',
  HISTORY_CHANGE: '이전 → 이후',
  HISTORY_PREVIEW: '최근 {count}건',
  HISTORY_ALL: '전체 {count}건',
  HISTORY_COLLAPSE: '접기',
  TEST_OK: '연결 시험에 성공했어요',
  TEST_FAIL: '연결 시험에 실패했어요',
  DELETE_TITLE: '결제 연결 삭제',
  DELETE_BODY: '{name} 설정을 삭제할까요? 삭제하면 되돌릴 수 없어요.',
  DELETE_CONFIRM: '삭제',
  DELETED: '결제 연결을 삭제했어요',
  DELETE_FAILED: '결제 연결을 삭제하지 못했어요.',
  CANCEL: '취소',
  CLOSE: '닫기',
  LOAD_FAILED: '결제 연결 정보를 불러오지 못했어요.',
  LOADING: '결제 연결을 불러오는 중…',
  RETRY: '다시 시도',
  BACK_TO_LIST: '목록으로',
  LOGIN_REQUIRED: '로그인이 필요해요.',
  TENANT_REQUIRED: '센터 정보를 확인할 수 없어요.'
});

export const ADMIN_SHOP_STATE_COPY = Object.freeze({
  RECONCILE_RAIL: '— PortOne엔 결제됐는데 회기가 안 붙었어요.',
  RECONCILE_OPEN: '주문 열기'
});

export const ADMIN_SHOP_SUITE_TEST_IDS = Object.freeze({
  ORDERS_PAGE: 'admin-shop-orders-page',
  ORDERS_STRIP: 'admin-shop-orders-strip',
  ORDERS_TABLE: 'admin-shop-orders-table',
  ORDERS_TOTAL: 'admin-shop-orders-total',
  ORDERS_RELOAD: 'admin-shop-orders-reload',
  ORDERS_SKELETON: 'admin-shop-orders-skeleton',
  ORDER_ROW: 'admin-shop-order-row',
  ORDER_MODAL_FOOTER: 'admin-shop-order-detail-footer',
  ORDER_REFUND_OUTLINE: 'admin-shop-order-refund-outline',
  ORDER_REFUND_ERROR: 'admin-shop-order-refund-error',
  REFUND_CONFIRM: 'admin-shop-refund-confirm',
  REFUND_CONFIRM_SUBMIT: 'admin-shop-refund-confirm-submit',
  REFUND_CONFIRM_REASON: 'admin-shop-refund-confirm-reason',
  REFUND_CONFIRM_USED_CHECK: 'admin-shop-refund-confirm-used-check',
  PRODUCTS_PAGE: 'admin-shop-products-page',
  PRODUCTS_TABLE: 'admin-shop-products-table',
  PRODUCTS_UNSET_RAIL: 'admin-shop-products-unset-rail',
  PRODUCT_ROW: 'admin-shop-product-row',
  PRODUCT_UNSET_CHIP: 'admin-shop-product-unset-chip',
  PRODUCT_STATUS_CHIP: 'admin-shop-product-status-chip',
  PRODUCTS_USAGE_NOTICE: 'admin-shop-products-usage-notice',
  PRODUCT_MALL_TOGGLE: 'admin-shop-product-mall-toggle',
  PRODUCT_HOME_TOGGLE: 'admin-shop-product-home-toggle',
  PRODUCT_EDITOR: 'admin-shop-product-editor',
  PRODUCT_EDITOR_SAVE: 'admin-shop-product-editor-save',
  PRODUCT_EDITOR_SESSIONS: 'admin-shop-product-editor-sessions',
  REWARD_PAGE: 'admin-shop-reward-page',
  REWARD_SAVE: 'admin-shop-reward-save',
  PG_DETAIL: 'admin-shop-pg-detail',
  PG_KEYSTRIP: 'admin-shop-pg-keystrip',
  PG_EDIT: 'admin-shop-pg-edit',
  PG_WEBHOOK_SAVE: 'admin-shop-pg-webhook-save',
  PG_CHECKLIST: 'admin-shop-pg-checklist',
  PG_HISTORY: 'admin-shop-pg-history',
  SUITE_TOAST: 'admin-shop-suite-toast'
});

/**
 * `{key}` 치환.
 *
 * @param {string} template
 * @param {Record<string, string|number>} values
 * @returns {string}
 */
export function formatAdminShopCopy(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}
