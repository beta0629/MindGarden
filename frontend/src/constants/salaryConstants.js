/**
 * 급여 관리 관련 상수
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */

// ==================== 급여 상태 ====================
export const SALARY_STATUS = {
  PENDING: 'PENDING',
  CALCULATED: 'CALCULATED',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
};

export const SALARY_STATUS_LABELS = {
  [SALARY_STATUS.PENDING]: '대기',
  [SALARY_STATUS.CALCULATED]: '계산완료',
  [SALARY_STATUS.APPROVED]: '승인완료',
  [SALARY_STATUS.PAID]: '지급완료',
  [SALARY_STATUS.CANCELLED]: '취소'
};

// ==================== 급여 유형 ====================
export const SALARY_TYPE = {
  FREELANCE: 'FREELANCE',
  REGULAR: 'REGULAR'
};

export const SALARY_TYPE_LABELS = {
  [SALARY_TYPE.FREELANCE]: '프리랜서',
  [SALARY_TYPE.REGULAR]: '정규직'
};

// ==================== 세금 유형 ====================
export const TAX_TYPE = {
  WITHHOLDING: 'WITHHOLDING',
  VAT: 'VAT',
  INCOME_TAX: 'INCOME_TAX',
  ADDITIONAL: 'ADDITIONAL'
};

export const TAX_TYPE_LABELS = {
  [TAX_TYPE.WITHHOLDING]: '원천징수',
  [TAX_TYPE.VAT]: '부가세',
  [TAX_TYPE.INCOME_TAX]: '소득세',
  [TAX_TYPE.ADDITIONAL]: '기타세금'
};

// ==================== 출력 형식 ====================
export const EXPORT_FORMAT = {
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  CSV: 'CSV'
};

export const EXPORT_FORMAT_LABELS = {
  [EXPORT_FORMAT.PDF]: 'PDF',
  [EXPORT_FORMAT.EXCEL]: 'Excel',
  [EXPORT_FORMAT.CSV]: 'CSV'
};

// ==================== 이메일 템플릿 ====================
export const EMAIL_TEMPLATE = {
  SALARY_CALCULATION: 'SALARY_CALCULATION',
  SALARY_APPROVAL: 'SALARY_APPROVAL',
  SALARY_PAYMENT: 'SALARY_PAYMENT',
  TAX_REPORT: 'TAX_REPORT'
};

export const EMAIL_TEMPLATE_LABELS = {
  [EMAIL_TEMPLATE.SALARY_CALCULATION]: '급여 계산서',
  [EMAIL_TEMPLATE.SALARY_APPROVAL]: '급여 승인 알림',
  [EMAIL_TEMPLATE.SALARY_PAYMENT]: '급여 지급 알림',
  [EMAIL_TEMPLATE.TAX_REPORT]: '세금 내역서'
};

// ==================== API 엔드포인트 ====================
export const SALARY_API_ENDPOINTS = {
  // 급여 계산
  CALCULATE: '/api/admin/salary/calculate',
  CALCULATIONS: '/api/admin/salary/calculations',
  
  // 세금 내역
  TAX_DETAILS: '/api/admin/salary/tax',
  TAX_BY_TYPE: '/api/admin/salary/tax/type',
  TAX_STATISTICS: '/api/admin/salary/tax/statistics',
  
  // 출력
  EXPORT_PDF: '/api/admin/salary/export/pdf',
  EXPORT_EXCEL: '/api/admin/salary/export/excel',
  EXPORT_CSV: '/api/admin/salary/export/csv',
  
  // 이메일
  SEND_EMAIL: '/api/admin/salary/email/send',
  EMAIL_TEMPLATES: '/api/admin/salary/email/templates'
};

// ==================== CSS 클래스 ====================
export const SALARY_CSS_CLASSES = {
  // 컨테이너
  CONTAINER: 'salary-container',
  CARD: 'salary-card',
  MODAL: 'salary-modal',
  
  // 테이블
  TABLE: 'salary-table',
  TABLE_HEADER: 'salary-table-header',
  TABLE_ROW: 'salary-table-row',
  TABLE_CELL: 'salary-table-cell',
  
  // 버튼
  BUTTON_PRIMARY: 'salary-btn-primary',
  BUTTON_SECONDARY: 'salary-btn-secondary',
  BUTTON_SUCCESS: 'salary-btn-success',
  BUTTON_WARNING: 'salary-btn-warning',
  BUTTON_DANGER: 'salary-btn-danger',
  
  // 상태 표시
  STATUS_BADGE: 'salary-status-badge',
  STATUS_PENDING: 'salary-status-pending',
  STATUS_CALCULATED: 'salary-status-calculated',
  STATUS_APPROVED: 'salary-status-approved',
  STATUS_PAID: 'salary-status-paid',
  STATUS_CANCELLED: 'salary-status-cancelled',
  
  // 금액 표시
  AMOUNT_POSITIVE: 'salary-amount-positive',
  AMOUNT_NEGATIVE: 'salary-amount-negative',
  AMOUNT_ZERO: 'salary-amount-zero',
  
  // 폼
  FORM_GROUP: 'salary-form-group',
  FORM_LABEL: 'salary-form-label',
  FORM_INPUT: 'salary-form-input',
  FORM_SELECT: 'salary-form-select',
  FORM_TEXTAREA: 'salary-form-textarea'
};

// ==================== 메시지 ====================
export const SALARY_MESSAGES = {
  // 성공 메시지
  CALCULATION_SUCCESS: '급여 계산이 완료되었습니다.',
  APPROVAL_SUCCESS: '급여 승인이 완료되었습니다.',
  PAYMENT_SUCCESS: '급여 지급이 완료되었습니다.',
  EMAIL_SENT_SUCCESS: '이메일이 성공적으로 발송되었습니다.',
  EXPORT_SUCCESS: '파일이 성공적으로 생성되었습니다.',
  
  // 오류 메시지
  CALCULATION_ERROR: '급여 계산 중 오류가 발생했습니다.',
  APPROVAL_ERROR: '급여 승인 중 오류가 발생했습니다.',
  PAYMENT_ERROR: '급여 지급 중 오류가 발생했습니다.',
  EMAIL_SEND_ERROR: '이메일 발송 중 오류가 발생했습니다.',
  EXPORT_ERROR: '파일 생성 중 오류가 발생했습니다.',
  
  // 확인 메시지
  CONFIRM_CALCULATION: '급여를 계산하시겠습니까?',
  CONFIRM_APPROVAL: '급여를 승인하시겠습니까?',
  CONFIRM_PAYMENT: '급여 지급을 완료하시겠습니까?',
  CONFIRM_EMAIL_SEND: '이메일을 발송하시겠습니까?',
  CONFIRM_EXPORT: '파일을 생성하시겠습니까?'
};

// ==================== 유효성 검사 ====================
export const SALARY_VALIDATION = {
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999999,
  MIN_TAX_RATE: 0,
  MAX_TAX_RATE: 100,
  REQUIRED_FIELDS: ['consultantId', 'period', 'baseSalary'],
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// ==================== 기본값 ====================
export const SALARY_DEFAULTS = {
  PAY_DAY_CODE: 'TENTH',
  CURRENCY: 'KRW',
  CURRENCY_SYMBOL: '₩',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DECIMAL_PLACES: 0,
  PAGE_SIZE: 20
};
