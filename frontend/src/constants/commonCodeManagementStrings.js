/**
 * CommonCodeManagement 화면 — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

/** 코드 그룹 키에 대한 표시용 한글 폴백 (메타데이터 없을 때) */
export const COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK = {
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
  ADMIN_MENU: '어드민메뉴',
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
  PRIORITY_LEVEL: '우선순위레벨',
  ADMIN_PERMISSIONS: '어드민권한',
  AGE_GROUP: '연령대',
  ALIMTALK_TEMPLATE: '알림톡템플릿'
};

/** 알림·검증 메시지 */
export const COMMON_CODE_MANAGEMENT_MSG = {
  ERR_LOAD_CODE_GROUPS: '코드그룹 목록을 불러오는데 실패했습니다.',
  ERR_NO_ACCESS_CODE_GROUP: '해당 코드 그룹에 대한 접근 권한이 없습니다.',
  ERR_BRANCH_CODE_GROUP_ADMIN_ONLY: '지점 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_ERP_CODE_GROUP_ADMIN_ONLY: 'ERP 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_FINANCIAL_CODE_GROUP_ADMIN_ONLY: '수입지출 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_CODE_VALUE_LABEL_REQUIRED: '코드 값과 라벨은 필수입니다.',
  ERR_SELECT_PARENT_CATEGORY: '상위 카테고리를 선택하세요.',
  SUCCESS_CODE_ADDED: '새 코드가 추가되었습니다!',
  ERR_CODE_ADD_FAILED: '코드 추가에 실패했습니다.',
  ERR_NO_CREATE_PERMISSION: '해당 코드 그룹에 대한 생성 권한이 없습니다.',
  CONFIRM_DELETE_CODE: '정말로 이 코드를 삭제하시겠습니까?',
  SUCCESS_CODE_DELETED: '코드가 삭제되었습니다!',
  ERR_NO_DELETE_PERMISSION: '해당 코드 그룹에 대한 삭제 권한이 없습니다.',
  ERR_CODE_DELETE_FAILED: '코드 삭제에 실패했습니다.',
  SUCCESS_CODE_STATUS_CHANGED: '코드 상태가 변경되었습니다!',
  ERR_NO_TOGGLE_PERMISSION: '해당 코드 그룹에 대한 상태 변경 권한이 없습니다.',
  ERR_CODE_TOGGLE_FAILED: '코드 상태 변경에 실패했습니다.',
  SUCCESS_CODE_UPDATED: '코드가 수정되었습니다!',
  ERR_NO_UPDATE_PERMISSION: '해당 코드 그룹에 대한 수정 권한이 없습니다.',
  ERR_CODE_UPDATE_FAILED: '코드 수정에 실패했습니다.'
};

/**
 * @param {string} groupName
 * @returns {string}
 */
export function formatCommonCodeManagementGroupCodesLoadError(groupName) {
  return `${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`;
}

/**
 * @param {string} displayName
 * @param {string} groupCode
 * @returns {string}
 */
export function formatCommonCodeManagementDetailTitle(displayName, groupCode) {
  return `${displayName} (${groupCode}) 세부 코드`;
}

/** 레이아웃·폼·표 등 UI 라벨 */
export const COMMON_CODE_MANAGEMENT_UI = {
  PAGE_TITLE: '공통코드 관리',
  HEADER_SUBTITLE: '코드그룹을 선택한 뒤 해당 그룹의 세부 코드를 관리합니다.',
  GROUP_LIST_TITLE: '코드그룹 목록',
  SEARCH_PLACEHOLDER: '코드그룹 검색...',
  CATEGORY_ALL: '전체 카테고리',
  CATEGORY_USER: '사용자 관련',
  CATEGORY_SYSTEM: '시스템 관련',
  CATEGORY_PAYMENT: '결제/급여',
  CATEGORY_CONSULTATION: '상담 관련',
  CATEGORY_ERP: 'ERP 관련',
  EMPTY_SELECT_TITLE: '코드그룹을 선택하세요',
  EMPTY_SELECT_DESC: '좌측 목록에서 코드그룹을 선택하여 상세 코드를 관리할 수 있습니다.',
  BTN_NEW: '신규 추가',
  FORM_TITLE_EDIT: '코드 수정',
  FORM_TITLE_NEW: '새 코드 추가',
  BTN_CLOSE: '닫기',
  LABEL_CODE_VALUE: '코드 값 *',
  PLACEHOLDER_CODE_VALUE: '예: ACTIVE, INACTIVE',
  LABEL_CODE_LABEL: '코드 라벨 *',
  PLACEHOLDER_CODE_LABEL: '예: 활성, 비활성',
  LABEL_PARENT_CATEGORY: '상위 카테고리 *',
  PLACEHOLDER_PARENT_CATEGORY: '상위 카테고리를 선택하세요',
  LABEL_DESCRIPTION: '설명',
  PLACEHOLDER_DESCRIPTION: '코드에 대한 설명을 입력하세요.',
  LABEL_SORT_ORDER: '정렬 순서',
  LABEL_ACTIVE_STATE: '활성 상태',
  BTN_CANCEL: '취소',
  BTN_SUBMIT_EDIT: '수정',
  BTN_SUBMIT_ADD: '추가',
  LOADING: '로딩중...',
  COL_CODE_LABEL: '코드 라벨',
  COL_CODE_VALUE: '코드 값',
  COL_PARENT_CATEGORY: '상위 카테고리',
  COL_STATUS: '상태',
  COL_SORT: '정렬',
  COL_DESCRIPTION: '설명',
  COL_MANAGE: '관리',
  EMPTY_NO_CODES: '등록된 세부 코드가 없습니다.',
  STATUS_ACTIVE: '활성',
  STATUS_INACTIVE: '비활성',
  BTN_EDIT: '수정',
  ACTION_DEACTIVATE: '비활성화',
  ACTION_ACTIVATE: '활성화',
  BTN_DELETE: '삭제',
  DISPLAY_EMPTY: '—'
};
