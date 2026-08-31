/**
 * 운영자 노출 코드그룹 한글 라벨 — 단일 SSOT
 * (공통코드·센터코드 화면 공유. codeValue/codeGroup 키 자체는 변경하지 않음.)
 *
 * @author Core Solution
 * @since 2026-08-31
 */

/** @type {Readonly<Record<string, string>>} */
export const CODE_GROUP_KO_FALLBACK = Object.freeze({
  USER_ROLE: '사용자역할',
  USER_STATUS: '사용자상태',
  USER_GRADE: '사용자등급',
  CONSULTANT_GRADE: '상담사등급',
  CLIENT_STATUS: '내담자상태',
  CLIENT_GRADE: '내담자등급',
  ADMIN_GRADE: '관리자등급',
  GENDER: '성별',
  RESPONSIBILITY: '담당분야',
  SPECIALTY: '전문분야',
  PROFESSIONAL_PROVIDER_TYPE: '전문가유형',

  STATUS: '상태',
  PRIORITY: '우선순위',
  MAPPING_STATUS: '매핑상태',
  ROLE: '역할',
  PERMISSION: '권한',
  ROLE_PERMISSION: '역할권한',
  ADMIN_PERMISSIONS: '관리자권한',
  AGE_GROUP: '연령대',
  COMPLETION_STATUS: '완료상태',

  PAYMENT_METHOD: '결제방법',
  PAYMENT_STATUS: '결제상태',
  PAYMENT_PROVIDER: '결제제공자',
  SALARY_TYPE: '급여유형',
  SALARY_PAY_DAY: '급여지급일',
  SALARY_OPTION_TYPE: '급여옵션유형',
  SALARY_GRADE: '급여등급',
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
  FINANCIAL_SUBCATEGORY: '재무하위카테고리',
  TAX_CATEGORY: '세무카테고리',
  TAX_CALCULATION: '세금계산',
  TAX_TYPE: '세금유형',
  VAT_APPLICABLE: '부가세적용',
  EXPENSE_CATEGORY: '지출카테고리',
  EXPENSE_SUBCATEGORY: '지출하위카테고리',
  INCOME_CATEGORY: '수입카테고리',
  INCOME_SUBCATEGORY: '수입하위카테고리',
  ITEM_CATEGORY: '항목카테고리',
  ITEM_STATUS: '항목상태',
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
  APPROVAL_TYPE: '승인유형',
  APPROVAL_PRIORITY: '승인우선순위',
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
  ALIMTALK_TEMPLATE: '알림톡템플릿',
  ALIMTALK_CONFIG: '알림톡설정',
  ALIMTALK_BIZ_TEMPLATE_CODE: '알림톡비즈템플릿',
  BILLING_CYCLE: '청구주기',
  ERROR_MESSAGE: '에러메시지',

  BUSINESS_TYPE: '업종',
  DAY_OF_WEEK: '요일',
  EMAIL_CONFIG: '이메일설정',

  CODE_GROUP_TYPE: '코드그룹유형',
  SYSTEM_STATUS: '시스템상태'
});

/**
 * @param {string|null|undefined} groupName
 * @returns {string}
 */
export function resolveCodeGroupKoreanLabel(groupName) {
  if (groupName == null || groupName === '') {
    return groupName == null ? '' : groupName;
  }
  const key = String(groupName);
  return CODE_GROUP_KO_FALLBACK[key] || key;
}
