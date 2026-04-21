/**
 * TenantCommonCodeManager — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

/** 코드 그룹 키에 대한 표시용 한글 폴백 (메타데이터 없을 때) */
export const TENANT_COMMON_CODE_GROUP_KO_FALLBACK = {
  USER_ROLE: '사용자역할',
  USER_STATUS: '사용자상태',
  USER_GRADE: '사용자등급',
  CONSULTANT_GRADE: '상담사등급',
  CLIENT_STATUS: '내담자상태',
  GENDER: '성별',
  RESPONSIBILITY: '담당분야',
  SPECIALTY: '전문분야',

  STATUS: '상태',
  PRIORITY: '우선순위',
  MAPPING_STATUS: '매핑상태',
  ROLE: '역할',
  PERMISSION: '권한',
  ROLE_PERMISSION: '역할권한',

  PAYMENT_METHOD: '결제방법',
  PAYMENT_STATUS: '결제상태',
  PAYMENT_PROVIDER: '결제제공자',
  SALARY_TYPE: '급여유형',
  SALARY_PAY_DAY: '급여지급일',
  SALARY_OPTION_TYPE: '급여옵션유형',
  CONSULTANT_GRADE_SALARY: '상담사등급급여',
  FREELANCE_BASE_RATE: '프리랜서기본요율',
  BUDGET_CATEGORY: '예산카테고리',
  BUDGET_STATUS: '예산상태',

  CONSULTATION_PACKAGE: '상담패키지',
  CONSULTATION_STATUS: '상담상태',
  CONSULTATION_TYPE: '상담유형',
  CONSULTATION_METHOD: '상담방법',
  CONSULTATION_LOCATION: '상담장소',
  CONSULTATION_SESSION: '상담세션',
  CONSULTATION_FEE: '상담료',
  CONSULTATION_MODE: '상담모드',
  SCHEDULE_STATUS: '스케줄상태',
  SCHEDULE_TYPE: '스케줄유형',
  SCHEDULE_FILTER: '스케줄필터',
  SCHEDULE_SORT: '스케줄정렬',
  SESSION_PACKAGE: '회기패키지',
  PACKAGE_TYPE: '패키지유형',
  ASSESSMENT_TYPE: '평가유형',

  PURCHASE_STATUS: '구매상태',
  PURCHASE_CATEGORY: '구매카테고리',
  FINANCIAL_CATEGORY: '재무카테고리',
  TAX_CATEGORY: '세무카테고리',
  TAX_CALCULATION: '세금계산',
  VAT_APPLICABLE: '부가세적용',
  EXPENSE_CATEGORY: '지출카테고리',
  EXPENSE_SUBCATEGORY: '지출하위카테고리',
  INCOME_CATEGORY: '수입카테고리',
  INCOME_SUBCATEGORY: '수입하위카테고리',
  ITEM_CATEGORY: '항목카테고리',
  TRANSACTION_TYPE: '거래유형',

  VACATION_TYPE: '휴가유형',
  VACATION_STATUS: '휴가상태',

  REPORT_PERIOD: '보고서기간',
  YEAR_RANGE: '년도범위',
  MONTH_RANGE: '월범위',
  DATE_RANGE: '날짜범위',
  DATE_RANGE_FILTER: '날짜범위필터',
  CHART_TYPE_FILTER: '차트유형필터',

  MENU: '메뉴',
  MENU_CATEGORY: '메뉴카테고리',
  ADMIN_MENU: '관리자메뉴',
  CLIENT_MENU: '내담자메뉴',
  CONSULTANT_MENU: '상담사메뉴',
  HQ_ADMIN_MENU: '관리자메뉴',
  BRANCH_SUPER_ADMIN_MENU: '지점수퍼관리자메뉴',
  COMMON_MENU: '공통메뉴',

  APPROVAL_STATUS: '승인상태',
  BANK: '은행',
  CURRENCY: '통화',
  LANGUAGE: '언어',
  TIMEZONE: '시간대',
  ADDRESS_TYPE: '주소유형',
  FILE_TYPE: '파일유형',
  MESSAGE_TYPE: '메시지유형',
  NOTIFICATION_TYPE: '알림유형',
  NOTIFICATION_CHANNEL: '알림채널',
  DURATION: '기간',
  SORT_OPTION: '정렬옵션',
  PRIORITY_LEVEL: '우선순위레벨'
};

/** API/동작 실패 시 메시지·알림·프롬프트 */
export const TENANT_COMMON_CODE_MSG = {
  ERR_CODE_GROUPS_FETCH_FALLBACK: '코드 그룹 조회 실패',
  ERR_CODE_GROUPS_LOAD: '코드 그룹을 불러오는 중 오류가 발생했습니다.',
  ERR_CODES_FETCH_FALLBACK: '코드 조회 실패',
  ERR_CODES_LOAD: '코드를 불러오는 중 오류가 발생했습니다.',
  ERR_SELECT_PARENT_CATEGORY: '상위 카테고리를 선택하세요.',
  SUCCESS_CODE_CREATED: '코드가 생성되었습니다.',
  SUCCESS_CODE_UPDATED: '코드가 수정되었습니다.',
  ERR_OPERATION_FALLBACK: '작업 실패',
  ERR_CODE_SAVE: '코드 저장 중 오류가 발생했습니다.',
  CONFIRM_DELETE: '정말 삭제하시겠습니까?',
  SUCCESS_CODE_DELETED: '코드가 삭제되었습니다.',
  ERR_DELETE_FALLBACK: '삭제 실패',
  ERR_CODE_DELETE: '코드 삭제 중 오류가 발생했습니다.',
  ERR_TOGGLE_FALLBACK: '상태 변경 실패',
  ERR_TOGGLE: '상태 변경 중 오류가 발생했습니다.',
  PROMPT_PACKAGE_NAME: '패키지명을 입력하세요:',
  PROMPT_PRICE_WON: '금액을 입력하세요 (원):',
  PROMPT_SESSIONS: '회기 수를 입력하세요:',
  SUCCESS_PACKAGE_CREATED: '상담 패키지가 생성되었습니다.',
  ERR_PACKAGE_CREATE: '패키지 생성 중 오류가 발생했습니다.',

  LOG_PARENT_OPTIONS_LOAD: '상위 카테고리 옵션 로드 오류:',
  LOG_CODE_GROUPS_FETCH: '코드 그룹 조회 오류:',
  LOG_CODES_FETCH: '코드 조회 오류:',
  LOG_CODE_SAVE: '코드 저장 오류:',
  LOG_CODE_DELETE: '코드 삭제 오류:',
  LOG_TOGGLE: '상태 변경 오류:',
  LOG_PACKAGE_CREATE: '패키지 생성 오류:'
};

/**
 * @param {string} message
 * @returns {string}
 */
export function formatTenantCommonCodeCreateFailure(message) {
  return `생성 실패: ${message}`;
}

/**
 * @param {string} packageName
 * @param {number|string} sessions
 * @returns {string}
 */
export function formatTenantCommonCodeQuickPackageDescription(packageName, sessions) {
  return `${packageName} (${sessions}회기)`;
}

/** 레이아웃·헤더·본문 UI */
export const TENANT_COMMON_CODE_UI = {
  LAYOUT_TITLE: '테넌트 공통코드',
  CONTENT_ARIA_LABEL: '테넌트 공통코드 관리 본문',
  HEADER_TITLE: '테넌트 공통코드 관리',
  HEADER_SUBTITLE: '상담 패키지, 결제 방법, 전문 분야 등 테넌트 전용 코드를 관리합니다.',
  GROUP_LIST_TITLE: '코드 그룹',
  SEARCH_PLACEHOLDER: '코드 그룹 검색...',
  LOADING: '불러오는 중...',
  EMPTY_SELECT_TITLE: '코드 그룹을 선택하세요',
  EMPTY_SELECT_DESC: '좌측 목록에서 그룹을 선택하면 우측에서 코드를 관리할 수 있습니다.',
  EMPTY_NO_CODES: '등록된 코드가 없습니다.',
  BTN_QUICK_PACKAGE: '빠른 패키지 생성',
  BTN_ADD_CODE: '코드 추가',
  BTN_FIRST_ADD: '첫 코드 추가하기',
  STATUS_ACTIVE: '활성',
  STATUS_INACTIVE: '비활성',
  BTN_EDIT: '수정',
  BTN_DELETE: '삭제',
  FIELD_PARENT_CATEGORY: '상위 카테고리',
  FIELD_DESCRIPTION: '설명',
  FIELD_AMOUNT: '금액',
  FIELD_SORT_ORDER: '순서',
  MODAL_TITLE_CREATE: '코드 추가',
  MODAL_TITLE_EDIT: '코드 수정',
  MODAL_BTN_CANCEL: '취소',
  MODAL_BTN_SUBMIT_CREATE: '생성',
  MODAL_BTN_SUBMIT_EDIT: '수정',
  FORM_LABEL_CODE_GROUP: '코드 그룹',
  FORM_LABEL_CODE_VALUE: '코드 값 *',
  FORM_LABEL_CODE_NAME: '코드명 *',
  FORM_LABEL_PARENT_CATEGORY: '상위 카테고리 *',
  FORM_LABEL_KOREAN_NAME: '한글명',
  FORM_LABEL_DESCRIPTION: '설명',
  FORM_LABEL_SORT_ORDER: '정렬 순서',
  FORM_LABEL_ACTIVE: '활성 상태',
  FORM_LABEL_EXTRA_JSON: '추가 데이터 (JSON)',
  FORM_PLACEHOLDER_CODE_VALUE: '예: PACKAGE_001',
  FORM_PLACEHOLDER_CODE_NAME: '예: 기본 10회기 패키지',
  FORM_PLACEHOLDER_PARENT: '상위 카테고리를 선택하세요',
  FORM_PLACEHOLDER_KOREAN: '코드명과 동일하게 입력 (선택)',
  FORM_PLACEHOLDER_DESCRIPTION: '코드에 대한 설명을 입력하세요',
  FORM_HELP_EXTRA_JSON:
    '상담 패키지·평가 유형의 경우 금액(price), 기간(duration), 회기(sessions) 등을 JSON 형식으로 입력하세요.',
  DISPLAY_DASH: '—',
  CURRENCY_WON_SUFFIX: '원',
  AMOUNT_EMPTY: '-'
};
