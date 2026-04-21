/**
 * IntegratedFinanceDashboard 사용자 노출 한글 UI 문자열
 * (OPS-02 에픽 1차 — 상수 분리)
 */

export const INTEGRATED_FINANCE_PAGE = {
  TITLE: '수입·지출 관리',
  SUBTITLE: '거래·손익·정산을 한곳에서'
};

export const IFS_ERRORS = {
  NO_PERMISSION: '수입·지출 관리 접근 권한이 없습니다.',
  INIT_FAILED: '초기화 중 오류가 발생했습니다.',
  LOAD_FAILED: '데이터를 불러오는 중 오류가 발생했습니다.',
  DAILY_REPORT_FETCH: '일간 리포트를 불러오는 중 오류가 발생했습니다.',
  MONTHLY_REPORT_FETCH: '월간 리포트를 불러오는 중 오류가 발생했습니다.',
  YEARLY_REPORT_FETCH: '년간 리포트를 불러오는 중 오류가 발생했습니다.',
  ACCOUNT_TYPES_FETCH: '계정과목 목록을 불러올 수 없습니다.'
};

export const INTEGRATED_FINANCE_TAB_ITEMS = [
  { key: 'overview', label: '개요' },
  { key: 'journal-entries', label: '거래 정리' },
  { key: 'ledgers', label: '계정별 내역' },
  { key: 'balance-sheet', label: '자산·부채 현황' },
  { key: 'income-statement', label: '손익 현황' },
  { key: 'cash-flow', label: '현금 흐름' },
  { key: 'settlement', label: '정산' },
  { key: 'daily', label: '일간 리포트' },
  { key: 'monthly', label: '월간 리포트' },
  { key: 'yearly', label: '연간 리포트' }
];

/** 접근성·본문 영역 라벨 */
export const IFS_ACCESSIBILITY = {
  CONTENT_BODY: '수입·지출 관리 본문',
  TAB_MAIN: '수입·지출 관리 탭 본문',
  TOOLBAR: '수입·지출 도구',
  REFRESH: '데이터 새로고침',
  SELECT_BANK_ACCOUNT: '계좌 선택'
};

/** 공통 표시 문자열 */
export const IFS_DISPLAY = {
  ERROR_PREFIX: '오류: ',
  LOADING_DATA: '데이터를 불러오는 중…'
};

/** 인라인 로딩 문구(말줄임 … 대신 ... 사용 구간) */
export const IFS_LOADING = {
  CASH_FLOW: '현금흐름표를 불러오는 중...',
  DAILY_REPORT: '일간 리포트 데이터를 불러오는 중...',
  MONTHLY_REPORT: '월간 리포트 데이터를 불러오는 중...',
  YEARLY_REPORT: '년간 리포트 데이터를 불러오는 중...',
  JOURNAL_LIST: '거래 목록을 불러오는 중...',
  GENERIC: '데이터를 불러오는 중...',
  ENTRY_DETAIL: '거래 정보를 불러오는 중...',
  LEDGER_ENTRIES: '거래 내역을 불러오는 중...'
};

/** 토스트·알림 */
export const IFS_NOTIFICATIONS = {
  BALANCE_SHEET_LOAD_FAILED: '대차대조표를 불러오는데 실패했습니다.',
  INCOME_STATEMENT_LOAD_FAILED: '손익계산서를 불러오는데 실패했습니다.',
  CASH_FLOW_LOAD_FAILED: '현금흐름표를 불러오는데 실패했습니다.',
  JOURNAL_LIST_LOAD_FAILED: '거래 목록을 불러오는데 실패했습니다.',
  JOURNAL_POST_SUCCESS: '거래가 반영되었습니다.',
  JOURNAL_POST_FAILED: '거래 반영에 실패했습니다. 다시 시도해 주세요.',
  BANK_ACCOUNTS_LOAD_FAILED: '계좌 목록을 불러오는데 실패했습니다.',
  LEDGERS_LOAD_FAILED: '계정별 내역을 불러오는데 실패했습니다.',
  SETTLEMENT_RULES_LOAD_FAILED: '정산 규칙을 불러오는데 실패했습니다.',
  SETTLEMENT_RESULTS_LOAD_FAILED: '정산 결과를 불러오는데 실패했습니다.',
  SETTLEMENT_CALC_SUCCESS: '정산이 계산되었습니다.',
  SETTLEMENT_CALC_FAILED: '정산 계산에 실패했습니다.',
  SETTLEMENT_APPROVE_SUCCESS: '정산이 승인되었습니다.',
  SETTLEMENT_APPROVE_FAILED: '정산 승인에 실패했습니다.',
  ENTRY_DETAIL_LOAD_FAILED: '거래 정보를 불러오는데 실패했습니다.',
  JOURNAL_MIN_TWO_LINES: '최소 2개의 라인이 필요합니다.',
  FORM_VALIDATE_ERROR: '입력 정보를 확인해주세요.',
  JOURNAL_CREATE_FAILED: '거래 등록에 실패했습니다. 다시 시도해 주세요.',
  JOURNAL_CREATE_SUCCESS: '거래가 등록되었습니다.',
  SETTLEMENT_RULE_SAVE_FAILED: '정산 규칙 저장에 실패했습니다.',
  SETTLEMENT_RULE_UPDATED: '정산 규칙이 수정되었습니다.',
  SETTLEMENT_RULE_CREATED: '정산 규칙이 생성되었습니다.',
  JOURNAL_UPDATE_FAILED: '거래 수정에 실패했습니다. 다시 시도해 주세요.',
  JOURNAL_UPDATE_SUCCESS: '거래가 수정되었습니다.'
};

/** 리포트 탭·기간 표기 조각 */
export const IFS_REPORT = {
  EMPTY_TITLE: '리포트를 불러오지 못했습니다',
  DAILY_SECTION_TITLE: '일간 재무 리포트',
  TOOLTIP_PREV_MONTH: '이전 달',
  TOOLTIP_NEXT_MONTH: '다음 달',
  TOOLTIP_PREV_YEAR: '전년도',
  TOOLTIP_NEXT_YEAR: '다음 년도',
  BTN_PREV: '이전',
  BTN_NEXT: '다음',
  YEAR_SUFFIX: '년',
  MONTH_SUFFIX: '월',
  MONTHLY_HEADING: '월간 재무 리포트 - ',
  YEARLY_HEADING: '년간 재무 리포트 - '
};

/** 현금흐름표 섹션(탭 라벨과 상이) */
export const IFS_CASH_FLOW_SECTION = {
  DASHBOARD_TITLE: '현금흐름표'
};

/** 테이블 data-label·표 헤더 정렬용 셀 라벨 */
export const IFS_TABLE_CELL = {
  ENTRY_LIST: '거래 목록',
  ENTRY_NUMBER: '거래번호',
  TOTAL_DEBIT: '차변합계',
  TOTAL_CREDIT: '대변합계',
  STATUS: '상태',
  ACTION: '작업',
  LEDGER_LIST: '계정별 내역',
  ACCOUNT_SUBJECT: '계정과목',
  PERIOD_START: '기간 시작',
  PERIOD_END: '기간 종료',
  OPENING_BALANCE: '기초잔액',
  CLOSING_BALANCE: '기말잔액',
  RULE_LIST: '정산 규칙 목록',
  RULE_NAME: '규칙명',
  BUSINESS_TYPE: '업종 유형',
  SETTLEMENT_TYPE: '정산 유형',
  CALC_METHOD: '계산 방법',
  ACTIVATION: '활성화',
  RESULT_LIST: '정산 결과 목록',
  SETTLEMENT_NUMBER: '정산번호',
  SETTLEMENT_PERIOD: '정산기간',
  TOTAL_REVENUE: '총매출',
  COMMISSION: '수수료',
  ROYALTY: '로열티',
  NET_SETTLEMENT: '순정산액',
  LINE_LIST: '거래 라인 목록',
  ACCOUNT: '계정',
  DEBIT: '차변',
  CREDIT: '대변',
  DESCRIPTION: '설명',
  LINE_INPUT: '거래 라인 입력',
  HISTORY_LIST: '거래 내역 목록'
};

/** 대차대조표 요약 카드 제목 */
export const IFS_BALANCE_SHEET_STATUS = {
  BALANCED: '대차대조표 균형',
  UNBALANCED: '대차대조표 불균형'
};

/** 거래 정리 도움말 토글 */
export const IFS_JOURNAL_HELP = {
  EXPANDED: '거래 정리란? (접기)',
  COLLAPSED: '거래 정리란? (펼치기)'
};

/** 분개·거래 상태 표시 */
export const IFS_JOURNAL_ENTRY_STATUS = {
  DRAFT: '초안',
  APPROVED: '승인됨',
  POSTED: '반영 완료'
};

/** 정산 결과 행 상태 */
export const IFS_SETTLEMENT_ROW_STATUS = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  PAID: '지급완료'
};

/** 규칙 활성 여부 표시 */
export const IFS_ACTIVE_LABEL = {
  ACTIVE: '활성',
  INACTIVE: '비활성'
};

/** 모달 제목 */
export const IFS_MODAL_TITLE = {
  ENTRY_DETAIL: '거래 상세',
  ENTRY_CREATE: '거래 등록',
  ENTRY_EDIT: '거래 수정',
  SETTLEMENT_RULE_CREATE: '정산 규칙 생성',
  SETTLEMENT_RULE_EDIT: '정산 규칙 수정',
  LEDGER_DETAIL: '계정별 내역 상세'
};

/** 입력 placeholder (한글) */
export const IFS_INPUT_PLACEHOLDER = {
  SETTLEMENT_PERIOD: '정산 기간 (예: 202512)',
  ENTRY_DESCRIPTION: '거래 내용을 입력하세요',
  SETTLEMENT_RULE_NAME: '정산 규칙명을 입력하세요',
  LINE_DESCRIPTION: '설명'
};

/** 표시용 기본값 */
export const IFS_FALLBACK = {
  ACCOUNT_NAME: '계정'
};

/** 헤더 우측 액션 */
export const IFS_HEADER_ACTIONS = {
  QUICK_EXPENSE: '빠른 지출',
  REGISTER_ENTRY: '거래 등록',
  VIEW_FINANCIAL_DETAIL: '상세 내역 보기',
  FINANCIAL_DETAIL_SHORT: '상세 내역'
};

/** 재무제표 탭 공통(대차·손익) */
export const IFS_FINANCIAL_STATEMENTS = {
  BALANCE_SHEET: '대차대조표',
  INCOME_STATEMENT: '손익계산서',
  AS_OF_DATE: '기준일자',
  START_DATE: '시작일',
  END_DATE: '종료일',
  LOAD_ERROR_TITLE: '데이터를 불러오지 못했습니다',
  LOAD_ERROR_DESC: '일시적인 오류일 수 있습니다. 아래 버튼으로 다시 시도해 주세요.',
  RETRY: '다시 불러오기',
  NO_DATA_TITLE: '해당 기간 데이터가 없습니다',
  NO_DATA_DESC_AS_OF: '선택한 기준일자에 등록된 내역이 없습니다.',
  NO_DATA_DESC_PERIOD: '선택한 기간에 등록된 내역이 없습니다.'
};

/** 개요 탭 — 빈 상태·KPI·매핑·요약 */
export const IFS_OVERVIEW = {
  EMPTY_TITLE: '데이터가 없습니다',
  EMPTY_DESC: '재무 개요를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.',
  INCOME_DESC_FALLBACK: '상담료, 기타수입',
  EXPENSE_DESC_FALLBACK: '급여, 임대료, 관리비, 세금',
  SECTION_FINANCIAL: '재무 개요',
  KPI_TOTAL_ITEMS: '총 아이템 수',
  TREND_REGISTERED_ITEMS: '등록된 비품 수',
  KPI_PENDING_APPROVALS: '승인 대기 요청',
  TREND_ADMIN_PENDING: '관리자 승인 대기',
  KPI_TOTAL_ORDERS: '총 주문 수',
  TREND_COMPLETED_ORDERS: '완료된 구매 주문',
  KPI_BUDGET_USAGE: '예산 사용률',
  SECTION_MAPPING: '매핑시스템 연동 상태',
  KPI_MAPPING_DEPOSIT_INCOME: '매핑 입금확인 수입',
  KPI_MAPPING_REFUND_EXPENSE: '매핑 환불처리 지출',
  KPI_MAPPING_TX_TOTAL: '총 연동 거래 건수',
  ROW_KEY_INCOME_CONSULT: '상담료',
  ROW_KEY_EXPENSE_OTHER: '기타',
  MAPPING_LIVE_TITLE: '실시간 연동',
  MAPPING_CTA_SUBTITLE: '매핑 ↔ ERP 자동 동기화',
  MAPPING_CTA_BUTTON: '매핑시스템 확인',
  SECTION_SUMMARY: '수입/지출 요약',
  LABEL_INCOME: '수입',
  LABEL_EXPENSE: '지출',
  LABEL_NET_PROFIT: '순이익',
  NET_PROFIT_TREND_HINT: '수입 − 지출 · 손익 현황 탭에서 항목별 비용 확인'
};

/** 지출 카테고리 코드 → 한글 라벨 (개요 탭 지출 카드 표시용, FinancialCommonCodeInitializer와 동기화) */
export const EXPENSE_CATEGORY_LABELS = {
  SALARY: '급여',
  RENT: '임대료',
  UTILITY: '관리비',
  OFFICE_SUPPLIES: '사무용품',
  TAX: '세금',
  MARKETING: '마케팅',
  EQUIPMENT: '장비',
  SOFTWARE: '소프트웨어',
  CONSULTING: '컨설팅',
  OTHER: '기타',
  CONSULTATION: '상담료',
  CONSULTATION_REFUND: '상담료환불',
  CONSULTATION_PARTIAL_REFUND: '상담 부분환불',
  OFFICE_RENT: '사무실임대료',
  STATIONERY: '문구류',
  ONLINE_ADS: '온라인광고',
  INCOME_TAX: '소득세',
  VAT: '부가가치세',
  CORPORATE_TAX: '법인세',
  기타: '기타'
};

/** 수입 카테고리 코드 → 한글 라벨 */
export const INCOME_CATEGORY_LABELS = {
  CONSULTATION: '상담료',
  상담료: '상담료',
  PACKAGE: '패키지',
  OTHER: '기타수입',
  기타: '기타수입'
};
