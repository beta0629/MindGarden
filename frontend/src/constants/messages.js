/**
 * 메시지 상수
 * 하드코딩된 메시지들을 상수로 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 공통 메시지
export const COMMON_MESSAGES = {
  // 로딩
  LOADING: '로딩 중...',
  PROCESSING: '처리 중...',
  SAVING: '저장 중...',
  DELETING: '삭제 중...',
  UPDATING: '업데이트 중...',
  
  // 성공
  SUCCESS: '성공적으로 처리되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  UPDATE_SUCCESS: '업데이트되었습니다.',
  
  // 오류
  ERROR: '오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  
  // 확인
  CONFIRM_DELETE: '정말 삭제하시겠습니까?',
  CONFIRM_SAVE: '저장하시겠습니까?',
  CONFIRM_UPDATE: '업데이트하시겠습니까?',
  
  // 기타
  NO_DATA: '데이터가 없습니다.',
  SEARCH_PLACEHOLDER: '검색어를 입력하세요...',
  SELECT_OPTION: '옵션을 선택하세요',
  REQUIRED_FIELD: '필수 입력 항목입니다.'
};

// 인증 관련 메시지
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGIN_FAILED: '아이디 또는 비밀번호 틀림',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  LOGOUT_ERROR: '로그아웃 중 오류가 발생했습니다.',
  REGISTER_SUCCESS: '회원가입이 완료되었습니다.',
  REGISTER_FAILED: '회원가입에 실패했습니다.',
  PASSWORD_CHANGED: '비밀번호가 변경되었습니다.',
  PASSWORD_CHANGE_FAILED: '비밀번호 변경에 실패했습니다.',
  
  // SMS 인증
  SMS_SENT: '인증 코드가 전송되었습니다.',
  SMS_SEND_FAILED: '인증 코드 전송에 실패했습니다.',
  SMS_VERIFY_SUCCESS: '인증이 완료되었습니다.',
  SMS_VERIFY_FAILED: '인증 코드가 올바르지 않습니다.',
  PHONE_INVALID: '올바른 휴대폰 번호를 입력해주세요.',
  CODE_INVALID: '6자리 인증 코드를 입력해주세요.',
  
  // 소셜 로그인
  SOCIAL_LOGIN_SUCCESS: '소셜 로그인이 완료되었습니다.',
  SOCIAL_LOGIN_FAILED: '소셜 로그인에 실패했습니다.',
  SOCIAL_ACCOUNT_LINKED: '소셜 계정이 연결되었습니다.',
  SOCIAL_ACCOUNT_UNLINKED: '소셜 계정 연결이 해제되었습니다.'
};

// 상담 관련 메시지
export const CONSULTATION_MESSAGES = {
  // 스케줄
  SCHEDULE_CREATED: '상담 일정이 생성되었습니다.',
  SCHEDULE_UPDATED: '상담 일정이 수정되었습니다.',
  SCHEDULE_DELETED: '상담 일정이 삭제되었습니다.',
  SCHEDULE_CANCELLED: '상담 일정이 취소되었습니다.',
  SCHEDULE_CONFIRMED: '상담 일정이 확인되었습니다.',
  
  // 상담사
  CONSULTANT_SELECTED: '상담사가 선택되었습니다.',
  CONSULTANT_CHANGED: '상담사가 변경되었습니다.',
  CONSULTANT_UNAVAILABLE: '선택한 상담사는 현재 이용할 수 없습니다.',
  
  // 내담자
  CLIENT_SELECTED: '내담자가 선택되었습니다.',
  CLIENT_MAPPING_CREATED: '내담자 매칭이 생성되었습니다.',
  CLIENT_MAPPING_UPDATED: '내담자 매칭이 수정되었습니다.',
  CLIENT_MAPPING_DELETED: '내담자 매칭이 삭제되었습니다.',
  
  // 세션
  SESSION_STARTED: '상담 세션이 시작되었습니다.',
  SESSION_ENDED: '상담 세션이 종료되었습니다.',
  SESSION_UNAVAILABLE: '사용 가능한 세션이 없습니다.',
  SESSION_EXHAUSTED: '모든 세션이 소진되었습니다.'
};

// 관리자 관련 메시지
export const ADMIN_MESSAGES = {
  // 사용자 관리
  USER_CREATED: '사용자가 생성되었습니다.',
  USER_UPDATED: '사용자 정보가 수정되었습니다.',
  USER_DELETED: '사용자가 삭제되었습니다.',
  USER_ACTIVATED: '사용자가 활성화되었습니다.',
  USER_DEACTIVATED: '사용자가 비활성화되었습니다.',
  
  // 상담사 관리
  CONSULTANT_APPROVED: '상담사가 승인되었습니다.',
  CONSULTANT_REJECTED: '상담사 승인이 거부되었습니다.',
  CONSULTANT_REGISTERED: '상담사가 등록되었습니다.',
  CONSULTANT_UPDATED: '상담사 정보가 수정되었습니다.',
  
  // 매칭 관리
  MAPPING_CREATED: '매칭이 생성되었습니다.',
  MAPPING_UPDATED: '매칭이 수정되었습니다.',
  MAPPING_DELETED: '매칭이 삭제되었습니다.',
  MAPPING_APPROVED: '매칭이 승인되었습니다.',
  MAPPING_REJECTED: '매칭이 거부되었습니다.',
  
  // 결제 관리
  PAYMENT_CONFIRMED: '결제가 확인되었습니다.',
  PAYMENT_CANCELLED: '결제가 취소되었습니다.',
  PAYMENT_REFUNDED: '환불이 처리되었습니다.',
  PAYMENT_PENDING: '결제 대기 중입니다.',
  
  // 통계
  STATS_LOADED: '통계 데이터를 불러왔습니다.',
  STATS_LOAD_FAILED: '통계 데이터 로드에 실패했습니다.',
  STATS_REFRESHED: '통계가 새로고침되었습니다.'
};

// 재무 관련 메시지
export const FINANCE_MESSAGES = {
  // 대시보드
  DASHBOARD_LOADED: '재무 대시보드를 불러왔습니다.',
  DASHBOARD_LOAD_FAILED: '재무 대시보드 로드에 실패했습니다.',
  DASHBOARD_REFRESHED: '재무 데이터가 새로고침되었습니다.',
  
  // 수익
  REVENUE_LOADED: '수익 데이터를 불러왔습니다.',
  REVENUE_LOAD_FAILED: '수익 데이터 로드에 실패했습니다.',
  
  // 지출
  EXPENSE_LOADED: '지출 데이터를 불러왔습니다.',
  EXPENSE_LOAD_FAILED: '지출 데이터 로드에 실패했습니다.',
  
  // 결제
  PAYMENT_LOADED: '결제 데이터를 불러왔습니다.',
  PAYMENT_LOAD_FAILED: '결제 데이터 로드에 실패했습니다.',
  
  // 포맷팅
  CURRENCY_FORMAT: '₩{amount}',
  PERCENTAGE_FORMAT: '{value}%',
  AMOUNT_FORMAT: '{amount}원'
};

// 유효성 검사 메시지
export const VALIDATION_MESSAGES = {
  // 필수 입력
  REQUIRED: '필수 입력 항목입니다.',
  REQUIRED_EMAIL: '이메일을 입력해주세요.',
  REQUIRED_PASSWORD: '비밀번호를 입력해주세요.',
  REQUIRED_NAME: '이름을 입력해주세요.',
  REQUIRED_PHONE: '휴대폰 번호를 입력해주세요.',
  
  // 형식 검사
  INVALID_EMAIL: '올바른 이메일 형식이 아닙니다.',
  INVALID_PHONE: '올바른 휴대폰 번호 형식이 아닙니다.',
  INVALID_PASSWORD: '비밀번호는 6자 이상이어야 합니다.',
  INVALID_NAME: '이름은 2자 이상이어야 합니다.',
  
  // 길이 제한
  TOO_SHORT: '너무 짧습니다.',
  TOO_LONG: '너무 깁니다.',
  MIN_LENGTH: '최소 {min}자 이상 입력해주세요.',
  MAX_LENGTH: '최대 {max}자까지 입력 가능합니다.',
  
  // 중복 검사
  EMAIL_EXISTS: '이미 사용 중인 이메일입니다.',
  PHONE_EXISTS: '이미 사용 중인 휴대폰 번호입니다.',
  USERNAME_EXISTS: '이미 사용 중인 사용자명입니다.',
  
  // 기타
  PASSWORDS_NOT_MATCH: '비밀번호가 일치하지 않습니다.',
  INVALID_DATE: '올바른 날짜 형식이 아닙니다.',
  INVALID_TIME: '올바른 시간 형식이 아닙니다.',
  INVALID_NUMBER: '올바른 숫자 형식이 아닙니다.'
};

// 상태 메시지
export const STATUS_MESSAGES = {
  // 일반 상태
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING: '대기 중',
  APPROVED: '승인됨',
  REJECTED: '거부됨',
  CANCELLED: '취소됨',
  COMPLETED: '완료됨',
  IN_PROGRESS: '진행 중',
  
  // 상담 상태
  SCHEDULED: '예약됨',
  CONFIRMED: '확인됨',
  CANCELLED: '취소됨',
  COMPLETED: '완료됨',
  NO_SHOW: '무단 결석',
  
  // 결제 상태
  PAYMENT_PENDING: '결제 대기',
  PAYMENT_COMPLETED: '결제 완료',
  PAYMENT_FAILED: '결제 실패',
  PAYMENT_REFUNDED: '환불 완료',
  
  // 매칭 상태
  MAPPING_ACTIVE: '활성 매칭',
  MAPPING_INACTIVE: '비활성 매칭',
  MAPPING_EXPIRED: '만료된 매칭',
  MAPPING_PENDING: '대기 중인 매칭'
};

// 전체 메시지 객체
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
