import { LOGIN_CREDENTIALS_MISMATCH_MESSAGE } from './loginDisplay';

/**
 * 메시지 상수
/**
 * 하드코딩된 메시지들을 상수로 관리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

export const COMMON_MESSAGES = {
  LOADING: '로딩 중...',
  PROCESSING: '처리 중...',
  SAVING: '저장 중...',
  DELETING: '삭제 중...',
  UPDATING: '업데이트 중...',
  
  SUCCESS: '성공적으로 처리되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  UPDATE_SUCCESS: '업데이트되었습니다.',
  
  ERROR: '오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  
  CONFIRM_DELETE: '정말 삭제하시겠습니까?',
  CONFIRM_SAVE: '저장하시겠습니까?',
  CONFIRM_UPDATE: '업데이트하시겠습니까?',
  
  NO_DATA: '데이터가 없습니다.',
  SEARCH_PLACEHOLDER: '검색어를 입력하세요...',
  SELECT_OPTION: '옵션을 선택하세요',
  REQUIRED_FIELD: '필수 입력 항목입니다.'
};

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGIN_FAILED: LOGIN_CREDENTIALS_MISMATCH_MESSAGE,
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  LOGOUT_ERROR: '로그아웃 중 오류가 발생했습니다.',
  REGISTER_SUCCESS: '회원가입이 완료되었습니다.',
  REGISTER_FAILED: '회원가입에 실패했습니다.',
  PASSWORD_CHANGED: '비밀번호가 변경되었습니다.',
  PASSWORD_CHANGE_FAILED: '비밀번호 변경에 실패했습니다.',
  
  SMS_SENT: '인증 코드가 전송되었습니다.',
  SMS_SEND_FAILED: '인증 코드 전송에 실패했습니다.',
  SMS_VERIFY_SUCCESS: '인증이 완료되었습니다.',
  SMS_VERIFY_FAILED: '인증 코드가 올바르지 않습니다.',
  PHONE_INVALID: '올바른 휴대폰 번호를 입력해주세요.',
  CODE_INVALID: '6자리 인증 코드를 입력해주세요.',
  
  SOCIAL_LOGIN_SUCCESS: '소셜 로그인이 완료되었습니다.',
  SOCIAL_LOGIN_FAILED: '소셜 로그인에 실패했습니다.',
  SOCIAL_ACCOUNT_LINKED: '소셜 계정이 연결되었습니다.',
  SOCIAL_ACCOUNT_UNLINKED: '소셜 계정 연결이 해제되었습니다.'
};

export const CONSULTATION_MESSAGES = {
  SCHEDULE_CREATED: '상담 일정이 생성되었습니다.',
  SCHEDULE_UPDATED: '상담 일정이 수정되었습니다.',
  SCHEDULE_DELETED: '상담 일정이 삭제되었습니다.',
  SCHEDULE_CANCELLED: '상담 일정이 취소되었습니다.',
  SCHEDULE_CONFIRMED: '상담 일정이 확인되었습니다.',
  
  CONSULTANT_SELECTED: '상담사가 선택되었습니다.',
  CONSULTANT_CHANGED: '상담사가 변경되었습니다.',
  CONSULTANT_UNAVAILABLE: '선택한 상담사는 현재 이용할 수 없습니다.',
  
  CLIENT_SELECTED: '내담자가 선택되었습니다.',
  CLIENT_MAPPING_CREATED: '내담자 매칭이 생성되었습니다.',
  CLIENT_MAPPING_UPDATED: '내담자 매칭이 수정되었습니다.',
  CLIENT_MAPPING_DELETED: '내담자 매칭이 삭제되었습니다.',
  
  SESSION_STARTED: '상담 세션이 시작되었습니다.',
  SESSION_ENDED: '상담 세션이 종료되었습니다.',
  SESSION_UNAVAILABLE: '사용 가능한 세션이 없습니다.',
  SESSION_EXHAUSTED: '모든 세션이 소진되었습니다.'
};

export const ADMIN_MESSAGES = {
  USER_CREATED: '사용자가 생성되었습니다.',
  USER_UPDATED: '사용자 정보가 수정되었습니다.',
  USER_DELETED: '사용자가 삭제되었습니다.',
  USER_ACTIVATED: '사용자가 활성화되었습니다.',
  USER_DEACTIVATED: '사용자가 비활성화되었습니다.',
  
  CONSULTANT_APPROVED: '상담사가 승인되었습니다.',
  CONSULTANT_REJECTED: '상담사 승인이 거부되었습니다.',
  CONSULTANT_REGISTERED: '상담사가 등록되었습니다.',
  CONSULTANT_UPDATED: '상담사 정보가 수정되었습니다.',
  
  MAPPING_CREATED: '매칭이 생성되었습니다.',
  MAPPING_UPDATED: '매칭이 수정되었습니다.',
  MAPPING_DELETED: '매칭이 삭제되었습니다.',
  MAPPING_APPROVED: '매칭이 승인되었습니다.',
  MAPPING_REJECTED: '매칭이 거부되었습니다.',
  
  PAYMENT_CONFIRMED: '결제가 확인되었습니다.',
  PAYMENT_CANCELLED: '결제가 취소되었습니다.',
  PAYMENT_REFUNDED: '환불이 처리되었습니다.',
  PAYMENT_PENDING: '결제 대기 중입니다.',
  
  STATS_LOADED: '통계 데이터를 불러왔습니다.',
  STATS_LOAD_FAILED: '통계 데이터 로드에 실패했습니다.',
  STATS_REFRESHED: '통계가 새로고침되었습니다.'
};

export const FINANCE_MESSAGES = {
  DASHBOARD_LOADED: '재무 대시보드를 불러왔습니다.',
  DASHBOARD_LOAD_FAILED: '재무 대시보드 로드에 실패했습니다.',
  DASHBOARD_REFRESHED: '재무 데이터가 새로고침되었습니다.',
  
  REVENUE_LOADED: '수익 데이터를 불러왔습니다.',
  REVENUE_LOAD_FAILED: '수익 데이터 로드에 실패했습니다.',
  
  EXPENSE_LOADED: '지출 데이터를 불러왔습니다.',
  EXPENSE_LOAD_FAILED: '지출 데이터 로드에 실패했습니다.',
  
  PAYMENT_LOADED: '결제 데이터를 불러왔습니다.',
  PAYMENT_LOAD_FAILED: '결제 데이터 로드에 실패했습니다.',
  
  CURRENCY_FORMAT: '₩{amount}',
  PERCENTAGE_FORMAT: '{value}%',
  AMOUNT_FORMAT: '{amount}원'
};

export const VALIDATION_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다.',
  REQUIRED_EMAIL: '이메일을 입력해주세요.',
  REQUIRED_PASSWORD: '비밀번호를 입력해주세요.',
  REQUIRED_NAME: '이름을 입력해주세요.',
  REQUIRED_PHONE: '휴대폰 번호를 입력해주세요.',

  LABEL_EMAIL_REQUIRED: '이메일 *',
  HELP_EMAIL_OR_PHONE_ONE_REQUIRED: '이메일 또는 휴대폰 번호 중 하나는 입력해 주세요.',
  EMAIL_OR_PHONE_ONE_REQUIRED: '이메일 또는 휴대폰 번호 중 하나는 입력해 주세요.',
  BUTTON_DUPLICATE_CHECK: '중복확인',
  BUTTON_CHECKING: '확인 중...',
  HELP_EMAIL_READONLY: '이메일은 변경할 수 없습니다.',
  EMAIL_AVAILABLE: '사용 가능한 이메일입니다.',
  EMAIL_DUPLICATE_CHECK_ERROR: '이메일 중복 확인 중 오류가 발생했습니다.',
  EMAIL_DUPLICATE_CHECK_REQUIRED_MESSAGE: '이미 사용 중인 이메일입니다. 이메일 중복확인을 해주세요.',
  EMAIL_DUPLICATE_CHECK_REQUIRED: '이메일 중복 확인을 해주세요.',
  INVALID_EMAIL_FORMAT: '올바른 이메일 형식을 입력해주세요.',
  
  INVALID_EMAIL: '올바른 이메일 형식이 아닙니다.',
  INVALID_PHONE:
    '휴대폰 번호만 입력해 주세요. 010·011·016~019이며 하이픈은 입력해도 됩니다.',
  INVALID_PASSWORD: '비밀번호는 6자 이상이어야 합니다.',
  INVALID_NAME: '이름은 2자 이상이어야 합니다.',
  
  TOO_SHORT: '너무 짧습니다.',
  TOO_LONG: '너무 깁니다.',
  MIN_LENGTH: '최소 {min}자 이상 입력해주세요.',
  MAX_LENGTH: '최대 {max}자까지 입력 가능합니다.',
  
  EMAIL_EXISTS: '이미 사용 중인 이메일입니다.',
  PHONE_AVAILABLE: '사용 가능한 휴대폰 번호입니다.',
  PHONE_DUPLICATE_CHECK_ERROR: '휴대폰 번호 중복 확인 중 오류가 발생했습니다.',
  PHONE_DUPLICATE_CHECK_REQUIRED_MESSAGE:
    '이미 사용 중인 휴대폰 번호입니다. 휴대폰 중복확인을 해주세요.',
  PHONE_DUPLICATE_CHECK_REQUIRED: '휴대폰 번호 중복 확인을 해주세요.',
  PHONE_EXISTS: '이미 사용 중인 휴대폰 번호입니다.',
  USERNAME_EXISTS: '이미 사용 중인 사용자 ID입니다.',
  
  PASSWORDS_NOT_MATCH: '비밀번호가 일치하지 않습니다.',
  INVALID_DATE: '올바른 날짜 형식이 아닙니다.',
  INVALID_TIME: '올바른 시간 형식이 아닙니다.',
  INVALID_NUMBER: '올바른 숫자 형식이 아닙니다.',
  INVALID_VEHICLE_PLATE: '차량번호는 숫자, 한글, 영문, 하이픈, 공백만 입력할 수 있으며 최대 32자입니다.'
};

export const STATUS_MESSAGES = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: '활성',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  INACTIVE: '비활성',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: '대기 중',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  APPROVED: '승인됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  REJECTED: '거부됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CANCELLED: '취소됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: '완료됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  IN_PROGRESS: '진행 중',
  
  SCHEDULED: '예약됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CONFIRMED: '확인됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CANCELLED: '취소됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: '완료됨',
  NO_SHOW: '무단 결석',
  
  PAYMENT_PENDING: '결제 대기',
  PAYMENT_COMPLETED: '결제 완료',
  PAYMENT_FAILED: '결제 실패',
  PAYMENT_REFUNDED: '환불 완료',
  
  MAPPING_ACTIVE: '활성 매칭',
  MAPPING_INACTIVE: '비활성 매칭',
  MAPPING_EXPIRED: '만료된 매칭',
  MAPPING_PENDING: '대기 중인 매칭'
};

export const MESSAGES = {
  COMMON: COMMON_MESSAGES,
  AUTH: AUTH_MESSAGES,
  CONSULTATION: CONSULTATION_MESSAGES,
  ADMIN: ADMIN_MESSAGES,
  FINANCE: FINANCE_MESSAGES,
  VALIDATION: VALIDATION_MESSAGES,
  STATUS: STATUS_MESSAGES
};

export default MESSAGES;
