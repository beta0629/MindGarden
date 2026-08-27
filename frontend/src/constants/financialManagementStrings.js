/**
 * FinancialManagement / Operator Ledger (`/erp/financial`) 사용자 노출 한글 UI 문자열
 * Operator Finance Phase 2 — Clinic-OS 장부 언어
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

/** Canonical page title */
export const FM_PAGE_TITLE = '들어온 돈 · 나간 돈';
export const FM_PAGE_TITLE_ID = 'operator-ledger-page-title';
export const FM_MAIN_ARIA_LABEL = '들어온 돈 · 나간 돈 본문';

export const FM_SESSION = {
  SUBTITLE_CHECKING: '세션 정보를 확인하는 중입니다.',
  LOADING: '세션 정보를 불러오는 중...'
};

export const FM_LOGIN = {
  SUBTITLE: '돈의 움직임을 확인·기록하려면 로그인해주세요.',
  HEADING: '로그인이 필요합니다.',
  BODY: '장부 기능을 사용하려면 로그인해주세요.'
};

export const fmFinancialPageSubtitleWithBranch = (branchName) =>
  `들어온 돈과 나간 돈을 관리합니다. (${branchName})`;

export const FM_FINANCIAL_PAGE_SUBTITLE_DEFAULT = '들어온 돈과 나간 돈을 확인·기록합니다.';

/** Period segment (quiet header) */
export const FM_PERIOD = {
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  THIS_YEAR: 'THIS_YEAR',
  CUSTOM: 'CUSTOM'
};

export const FM_PERIOD_OPTIONS = [
  { value: FM_PERIOD.THIS_MONTH, label: '이번 달' },
  { value: FM_PERIOD.LAST_MONTH, label: '지난달' },
  { value: FM_PERIOD.THIS_YEAR, label: '올해' },
  { value: FM_PERIOD.CUSTOM, label: '직접' }
];

export const FM_PERIOD_ARIA_LABEL = '조회 기간';

export const FM_RECORD_CTA = '돈 기록';
export const FM_RECORD_CTA_ARIA = '돈 기록하기';

/** Compact summary strip — 순이익/건 금지 */
export const FM_SUMMARY = {
  INCOME_LABEL: '들어온 합',
  EXPENSE_LABEL: '나간 합',
  REMAINING_LABEL: '남은 돈',
  BAND_ARIA: '기간 합계',
  DASH: '—'
};

/** Main stage view toggle — table | calendar only (not dashboard peer) */
export const FM_LEDGER_VIEW = {
  TABLE: 'table',
  CALENDAR: 'calendar'
};

export const FM_LEDGER_VIEW_OPTIONS = [
  { value: FM_LEDGER_VIEW.TABLE, label: '테이블' },
  { value: FM_LEDGER_VIEW.CALENDAR, label: '달력' }
];

export const FM_LEDGER_VIEW_ARIA = '장부 보기 전환';

/** Operator ledger calendar organism — Korean Clinic-OS copy (no lucide/i18n keys) */
export const FM_LEDGER_CALENDAR = {
  WEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],
  GRID_ARIA: '장부 달력',
  DAY_LIST_ARIA: '선택한 날짜 거래 목록',
  EMPTY_DAY: '이 날짜에 등록된 내역이 없습니다.',
  INCOME_PREFIX: '+',
  EXPENSE_PREFIX: '−',
  TIME_FALLBACK: '—'
};

/** @deprecated Phase 2 — equal peer tabs removed; kept for legacy tests/compat */
export const FM_VIEW_TABS = {
  ARIA_LABEL: '재무 뷰 전환',
  TRANSACTIONS: '거래 내역',
  CALENDAR: '달력',
  DASHBOARD: '대시보드'
};

/** PER_PAGE G3-01: 재무 거래 목록 기본 보기 = 테이블 */
export const FM_TRANSACTION_DEFAULT_VIEW_MODE = 'table';

/** Legacy card/compact options (saved-view compat); primary UI uses table|calendar */
export const FM_TRANSACTION_VIEW_MODE_OPTIONS = [
  { value: 'card', label: '카드' },
  { value: 'compact', label: '작은 카드' },
  { value: 'table', label: '테이블' }
];

export const FM_EXPORT = {
  ARIA_LABEL: '거래 목록 내보내기',
  BUTTON: '내보내기'
};

export const FM_TX_TABLE_LABELS = {
  TRANSACTION_DATE: '일자',
  DESCRIPTION: '내용',
  INCOME_AMOUNT: '들어온 금액',
  EXPENSE_AMOUNT: '나간 금액',
  TRANSACTION_TYPE: '유형',
  CATEGORY: '카테고리',
  STATUS: '상태',
  MAPPING: '매핑',
  ACTIONS: '관리'
};

export const FM_TX_TYPE = {
  INCOME: '들어온 돈',
  EXPENSE: '나간 돈',
  ALL: '전체'
};

export const FM_CATEGORY_DISPLAY = {
  CONSULTATION: '상담료',
  CONSULTATION_FEE: '상담료',
  SALARY: '급여',
  RENT: '임대료',
  UTILITY: '관리비',
  MANAGEMENT_FEE: '관리비',
  OFFICE_SUPPLIES: '사무용품',
  TAX: '세금',
  PURCHASE: '구매',
  PAYMENT: '결제',
  OTHER: '기타'
};

/**
 * 카테고리 코드를 한글 라벨로 변환. 매핑에 없으면 원본 코드를 반환한다.
 * @param {string|null|undefined} category
 * @returns {string}
 */
export function getCategoryDisplayLabel(category) {
  if (!category) {
    return '-';
  }
  return FM_CATEGORY_DISPLAY[category] || category;
}

export const FM_ERRORS = {
  DATA_LOAD: '데이터를 불러오는 중 오류가 발생했습니다.',
  TX_LIST: '재무 거래 목록을 불러올 수 없습니다.',
  TX_LIST_NETWORK: '재무 거래 목록을 불러오는 중 오류가 발생했습니다. 서버 연결을 확인해주세요.',
  MAPPING_DETAIL_FALLBACK: '매핑 정보를 불러올 수 없습니다.'
};

export const FM_TOAST = {
  DELETE_SUCCESS: '거래가 성공적으로 삭제되었습니다.',
  DELETE_GENERIC: '거래 삭제 중 오류가 발생했습니다.'
};

export const fmToastDeleteFailed = (message) => `거래 삭제에 실패했습니다: ${message}`;

export const FM_TX_DESCRIPTION_MATCH = {
  CONSULTATION_DEPOSIT: '상담료 입금 확인',
  CONSULTATION_REFUND: '상담료 환불'
};

export const FM_MAPPING_ARIA = {
  CONNECTED_MEMBERS: '매핑 연결 회원',
  CLIENT_EYEBROW: '내담자 (결제 회원)',
  CONSULTANT_EYEBROW: '상담사',
  REMAINING_SESSIONS_PREFIX: '남은 회기',
  REMAINING_SESSIONS_SUFFIX: '회'
};

export const fmMappingAriaClient = (name) => `내담자 ${name}`;
export const fmMappingAriaConsultant = (name) => `상담사 ${name}`;
export const fmMappingAriaPackage = (name) => `패키지 ${name}`;
export const fmMappingAriaMappingStatus = (v) => `매핑 상태 ${v}`;
export const fmMappingAriaPaymentStatus = (v) => `결제 상태 ${v}`;
export const fmMappingAriaRemainingSessions = (n) => `남은 회기 ${n}회`;

export const FM_ROW_ACTIONS = {
  GROUP: '거래 작업',
  VIEW: '보기',
  EDIT: '수정',
  DELETE: '삭제'
};

export const FM_FILTER = {
  ARIA_TOOLBAR: '거래 필터',
  PERIOD: '기간',
  DATE_RANGE_ALL: '전체',
  DATE_RANGE_TODAY: '일간',
  DATE_RANGE_WEEK: '주간',
  DATE_RANGE_MONTH: '월간',
  DATE_RANGE_CUSTOM: '직접 입력',
  MONTH_QUERY: '조회 월',
  PREV_MONTH: '이전 달',
  NEXT_MONTH: '다음 달',
  ALL_PERIOD_HINT: '전체 기간은 데이터가 많을 수 있습니다. 필요할 때만 선택해 주세요.',
  START_DATE: '시작일',
  END_DATE: '종료일',
  TRANSACTION_TYPE: '유형',
  CATEGORY: '카테고리',
  SEARCH: '검색',
  SEARCH_PLACEHOLDER: '내용 검색...',
  SEARCH_SCOPE_BADGE: '이 목록에서만 검색',
  SEARCH_SCOPE_HINT: '다른 페이지에 있을 수 있는 거래는 다음 페이지를 눌러 확인하세요.',
  SUBMIT: '검색'
};

export const FM_FILTER_TX_TYPE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'INCOME', label: '들어온 돈' },
  { value: 'EXPENSE', label: '나간 돈' }
];

export const FM_FILTER_CATEGORY_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'CONSULTATION', label: '상담료' },
  { value: 'SALARY', label: '급여' },
  { value: 'RENT', label: '임대료' },
  { value: 'UTILITY', label: '관리비' },
  { value: 'OFFICE_SUPPLIES', label: '사무용품' },
  { value: 'OTHER', label: '기타' }
];

export const FM_LOADING = {
  INLINE: '로딩 중...',
  TAX_SUMMARY: '세금 집계를 불러오는 중...'
};

export const FM_RETRY = {
  ARIA_LABEL: '다시 시도',
  LABEL: '다시 시도'
};

export const FM_TAX_SUMMARY = {
  SECTION_TITLE: '월별 세금 요약',
  INTRO_P1:
    '수입 거래의 부가세·원천징수와 지출 거래의 세액 필드 합계입니다. (저장된 금액 기준)',
  INTRO_P2:
    '수입 금액이 부가세 포함가인 거래는, 부가세(VAT) 열은 포함가에서 분리한 세액의 합계입니다.',
  NOTICE_TITLE: '세금 신고·납부 안내(참고)',
  NOTICE_P1: '본 화면의 안내는 참고용이며, 실제 신고·납부 기한과 대상은 사업자 등록·과세 유형 등에 따라',
  NOTICE_P2: '달라질 수 있습니다. 정확한 사항은',
  HOMETAX: '홈택스',
  NTS: '국세청',
  NOTICE_P3: '또는 세무사 등 전문가를 통해 확인하시기 바랍니다.',
  BULLET_WITHHOLDING:
    '원천징수: 일반적으로 소득 지급이 속하는 달의 다음 달 10일까지 신고·납부(원천징수이행상황 신고 등)인 경우가 많습니다. 반기 납부 승인 시에는 7·10월, 익년 1·10월 등 별도 기한이 적용될 수 있습니다.',
  BULLET_VAT:
    '부가가치세: 일반과세자는 반기별 신고·납부가 일반적인 경우가 많으며(과세 유형·규모에 따라 다름), 이 화면의 월별 금액과 별개로 매월 10일이 부가가치세 신고·납부 기한이 아닙니다.',
  BULLET_DISCLAIMER:
    '위 내용은 국세청 안내를 바탕으로 한 요약이며, 법령 개정 등으로 달라질 수 있습니다.',
  YEAR_LABEL: '연도',
  YEAR_OPTION_SUFFIX: '년',
  TH_MONTH: '월',
  TH_VAT: '부가세(VAT)',
  TH_WITHHOLDING: '원천징수',
  TH_EXPENSE_VAT: '지출(세액)',
  FOOT_SUM: '합계'
};

export const FM_TX_LIST_SECTION = {
  TITLE: '거래 내역',
  VIEW_TOGGLE_ARIA: '목록 보기 전환',
  EMPTY: '선택한 기간에 등록된 내역이 없습니다.',
  EMPTY_SEARCH: '일치하는 거래 내역이 없습니다. 검색어나 필터를 변경해보세요.',
  EMPTY_CTA: '돈 기록하기'
};

export const FM_CARD_LABELS = {
  TYPE: '유형',
  CATEGORY: '카테고리',
  STATUS: '상태'
};

export const FM_PAGINATION = {
  PREV: '이전',
  NEXT: '다음',
  SERVER_TOTAL_HINT: '아래 페이지 수는 기간·유형·카테고리 조건 기준입니다. 검색어는 불러온 목록 안에서만 적용됩니다.'
};

/** @deprecated Phase 2 — dashboard peer removed; labels kept for i18n fallback */
export const FM_DASHBOARD = {
  SECTION_ARIA: '재무 대시보드',
  SECTION_TITLE: '재무 대시보드',
  KPI_INCOME: '들어온 합',
  KPI_EXPENSE: '나간 합',
  KPI_NET: '남은 돈',
  KPI_TX_COUNT: '거래 건수',
  KPI_THIS_MONTH: '이번 달',
  MAPPING_STATUS_TITLE: '매핑 연동 현황',
  KPI_MAPPING_INCOME: '매핑 연동 수입',
  KPI_MAPPING_INCOME_SUB: '자동 생성된 상담료 수입',
  KPI_MAPPING_REFUND: '매핑 연동 환불',
  KPI_MAPPING_REFUND_SUB: '자동 생성된 환불 지출',
  QUICK_ACTIONS: '빠른 액션',
  GO_TRANSACTIONS: '거래 내역 보기',
  GO_CALENDAR: '달력 뷰 보기',
  GO_MAPPING: '매핑 시스템 확인',
  GO_INTEGRATED_FINANCE: '통합 재무 대시보드',
  TX_COUNT_SUFFIX: '건'
};

export const FM_DELETE_MODAL = {
  TITLE: '거래 삭제',
  CANCEL: '취소',
  CONFIRM: '삭제',
  WARNING: '이 작업은 되돌릴 수 없습니다. 아래 거래를 영구 삭제할까요?',
  FIELD_TX_ID: '거래 번호:',
  FIELD_AMOUNT: '금액:'
};

/** 금액 표기 접미사 (삭제 확인 등) */
export const FM_CURRENCY_SUFFIX = '원';

export const FM_DETAIL_MODAL = {
  TITLE_PREFIX: '거래 상세 정보',
  CLOSE: '닫기',
  VIEW_MAPPING: '매핑 보기',
  BASIC_INFO: '기본 정보',
  LABEL_TX_TYPE: '거래 유형:',
  LABEL_CATEGORY: '카테고리:',
  LABEL_TX_DATE: '거래일:',
  LABEL_DESCRIPTION: '설명:',
  MAPPING_SECTION: '매핑 연동 정보',
  LOADING_MAPPING: '매핑 정보를 불러오는 중...',
  LABEL_MAPPING_ID: '매핑 ID:',
  LABEL_CLIENT: '내담자 (결제 회원):',
  LABEL_CONSULTANT: '상담사:',
  LABEL_PACKAGE_NAME: '패키지명:',
  LABEL_TOTAL_SESSIONS: '총 회기수:',
  LABEL_REMAINING_SESSIONS: '남은 회기:',
  SESSION_SUFFIX: '회',
  LABEL_MAPPING_STATUS: '매핑 상태:',
  LABEL_PAYMENT_STATUS: '결제 상태:',
  LABEL_PRICE_PER_SESSION: '회기당 단가:',
  LABEL_PACKAGE_PRICE: '패키지 가격:',
  LABEL_PAYMENT_AMOUNT: '결제 금액:',
  PACKAGE_PRICE_MISMATCH: '(패키지 가격과 다름)',
  LABEL_CONSISTENCY: '일관성 검사:',
  CONSISTENCY_OK: '정상',
  CONSISTENCY_ERROR: '불일치',
  LABEL_RELATED_TX: '관련 거래:',
  OTHER_LINK_SECTION: '연동 정보',
  LABEL_RELATED_TYPE: '연동 유형:',
  LABEL_RELATED_ID: '연동 ID:'
};

export const FM_WITHHOLDING_DETAIL_HINT =
  '(입금 총액 대비 사업소득 원천징수 예정: 국세 3%, 지방세 0.3%, 합계 3.3%. 부가세와 별개)';

/** Tax disclosure — accountant tools behind fold */
export const FM_TAX_DISCLOSURE = {
  TITLE: '세무사용 자료',
  CAPTION: '세무사·회계사 제출용 법정 재무제표 및 상세 회계 리포트',
  ARIA: '세무사용 자료 펼치기'
};

export const FM_TAX_STATEMENT_TABS = [
  { key: 'income-statement', label: '손익 현황' },
  { key: 'balance-sheet', label: '자산·부채 현황' },
  { key: 'cash-flow', label: '현금 흐름' },
  { key: 'journal-entries', label: '거래 정리' },
  { key: 'ledgers', label: '계정별 내역' },
  { key: 'daily', label: '일간 리포트' },
  { key: 'monthly', label: '월간 리포트' },
  { key: 'yearly', label: '연간 리포트' },
  { key: 'settlement', label: '정산 관리' }
];

export const FM_MONEY_RECORD = {
  TITLE: '돈 기록',
  TYPE_LABEL: '유형',
  TYPE_INCOME: '들어온 돈 (+)',
  TYPE_EXPENSE: '나간 돈 (-)',
  SUBMIT: '기록하기',
  CANCEL: '취소'
};
