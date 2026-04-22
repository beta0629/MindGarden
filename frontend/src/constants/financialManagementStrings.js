/**
 * FinancialManagement 사용자 노출 한글 UI 문자열
 * (OPS-02 에픽 — 상수 분리)
 */

export const FM_PAGE_TITLE = '재무 관리';

export const FM_SESSION = {
  SUBTITLE_CHECKING: '세션 정보를 확인하는 중입니다.',
  LOADING: '세션 정보를 불러오는 중...'
};

export const FM_LOGIN = {
  SUBTITLE: '재무 거래 및 회계를 관리하려면 로그인해주세요.',
  HEADING: '로그인이 필요합니다.',
  BODY: '재무 관리 기능을 사용하려면 로그인해주세요.'
};

export const fmFinancialPageSubtitleWithBranch = (branchName) =>
  `재무 거래 및 회계를 관리합니다. (${branchName})`;

export const FM_FINANCIAL_PAGE_SUBTITLE_DEFAULT = '재무 거래 및 회계를 관리할 수 있습니다.';

export const FM_EXPORT = {
  ARIA_LABEL: '거래 목록 내보내기',
  BUTTON: '내보내기'
};

export const FM_VIEW_TABS = {
  ARIA_LABEL: '재무 뷰 전환',
  TRANSACTIONS: '거래 내역',
  CALENDAR: '달력 뷰',
  DASHBOARD: '대시보드'
};

export const FM_TRANSACTION_VIEW_MODE_OPTIONS = [
  { value: 'card', label: '카드' },
  { value: 'compact', label: '작은 카드' },
  { value: 'table', label: '테이블' }
];

export const FM_TX_TABLE_LABELS = {
  TRANSACTION_DATE: '일자',
  TRANSACTION_TYPE: '유형',
  CATEGORY: '카테고리',
  STATUS: '상태',
  MAPPING: '매핑',
  ACTIONS: '작업'
};

export const FM_TX_TYPE = {
  INCOME: '수입',
  EXPENSE: '지출'
};

export const FM_CATEGORY_DISPLAY = {
  CONSULTATION: '상담료'
};

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
  ARIA_TOOLBAR: '재무 거래 필터',
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
  TRANSACTION_TYPE: '거래 유형',
  CATEGORY: '카테고리',
  SEARCH: '검색',
  SEARCH_PLACEHOLDER: '상담사명, 내담자명, 설명 검색...',
  SUBMIT: '검색'
};

export const FM_FILTER_TX_TYPE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'INCOME', label: '수입' },
  { value: 'EXPENSE', label: '지출' }
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
  TITLE: '재무 거래 내역',
  VIEW_TOGGLE_ARIA: '목록 보기 전환',
  EMPTY: '거래 내역이 없습니다.'
};

export const FM_CARD_LABELS = {
  TYPE: '유형',
  CATEGORY: '카테고리',
  STATUS: '상태'
};

export const FM_PAGINATION = {
  PREV: '이전',
  NEXT: '다음'
};

export const FM_DASHBOARD = {
  SECTION_ARIA: '재무 대시보드',
  SECTION_TITLE: '재무 대시보드',
  KPI_INCOME: '수입 합계',
  KPI_EXPENSE: '지출 합계',
  KPI_NET: '순이익',
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
  '(입금 총액 대비 사업소득 원천징수 예정, 부가세와 별개)';
