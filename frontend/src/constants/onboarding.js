 * 온보딩 관련 상수
 * 하드코딩 금지 원칙에 따라 모든 상수를 여기에 정의
 * 백엔드 공통 코드에서 동적으로 가져와야 하는 값들은 여기에 기본값만 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

export const CODE_GROUPS = {
  RISK_LEVEL: 'RISK_LEVEL', // 위험도 코드 그룹
  ONBOARDING_STATUS: 'ONBOARDING_STATUS' // 온보딩 상태 코드 그룹
};

export const DEFAULT_RISK_LEVEL = 'LOW';

export const DEFAULT_COLORS = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: 'var(--mg-warning-500)',
  IN_REVIEW: 'var(--mg-primary-500)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  APPROVED: 'var(--mg-success-500)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  REJECTED: 'var(--mg-error-500)',
  ON_HOLD: '#9e9e9e',
  LOW: '#2e7d32',
  MEDIUM: '#e65100',
  HIGH: '#c62828'
};

export const DEFAULT_BG_COLORS = {
  LOW: '#e8f5e9',
  MEDIUM: '#fff3e0',
  HIGH: '#ffebee'
};

export const FORM_FIELDS = {
  TENANT_NAME: 'tenantName',
  BUSINESS_TYPE: 'businessType',
  CONTACT_PHONE: 'contactPhone',
  RISK_LEVEL: 'riskLevel',
  CHECKLIST_JSON: 'checklistJson'
};

export const PLACEHOLDERS = {
  TENANT_NAME: '회사명을 입력하세요',
  CONTACT_PHONE: '010-1234-5678',
  BUSINESS_TYPE: '업종을 선택하세요'
};

export const HELP_TEXTS = {
  CONTACT_PHONE: '선택 사항입니다. 승인 후 연락을 위해 사용됩니다.',
  RISK_LEVEL: '기본값은 낮음(LOW)입니다.'
};

export const MESSAGES = {
  SUBMIT_SUCCESS: '온보딩 요청이 성공적으로 제출되었습니다.',
  SUBMIT_ERROR: '온보딩 요청 처리 중 오류가 발생했습니다.',
  LOAD_ERROR: '온보딩 요청 목록을 불러오는데 실패했습니다.',
  DETAIL_LOAD_ERROR: '온보딩 요청 상세 정보를 불러오는데 실패했습니다.',
  NO_REQUESTS: '온보딩 요청이 없습니다.',
  LOADING: '로딩 중...',
  SUBMITTING: '제출 중...',
  SUBMIT: '요청 제출',
  CANCEL: '취소',
  NEW_REQUEST: '새 요청하기',
  DETAIL: '상세보기',
  STATUS_FILTER: '상태 필터:',
  ALL: '전체'
};

export const API_RESPONSE_KEYS = {
  SUCCESS: 'success',
  DATA: 'data',
  COUNT: 'count',
  MESSAGE: 'message'
};

export const STORAGE_KEYS = {
  USER: 'user'
};

export const DEFAULT_USER_EMAIL = 'anonymous@example.com';

