/**
 * 결제 테스트 관련 상수
 * CSS 클래스, JavaScript 변수, 메시지 등을 중앙에서 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */

// API 엔드포인트
export const PAYMENT_TEST_API = {
  CREATE_PAYMENT: '/api/payments',
  PAYMENT_SCENARIOS: '/api/test/payment/scenarios',
  PAYMENT_STATUS: '/api/payments',
  WEBHOOK: '/api/payments/webhook',
  STATISTICS: '/api/test/payment/statistics-test',
  HEALTH: '/api/test/payment/health'
};

// HTTP 메서드 및 헤더
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  APPLICATION_JSON: 'application/json'
};

// 테스트 데이터 기본값
export const DEFAULT_TEST_DATA = {
  METHOD: 'CARD',
  PROVIDER: 'TOSS',
  AMOUNT: 100000,
  PAYER_ID: 1,
  RECIPIENT_ID: 1,
  BRANCH_ID: 1,
  TIMEOUT_MINUTES: 30
};

// 결제 방법 옵션
export const PAYMENT_METHODS = [
  { value: 'CARD', label: '신용카드' },
  { value: 'BANK_TRANSFER', label: '계좌이체' },
  { value: 'VIRTUAL_ACCOUNT', label: '가상계좌' },
  { value: 'MOBILE', label: '모바일결제' }
];

// 결제 대행사 옵션
export const PAYMENT_PROVIDERS = [
  { value: 'TOSS', label: '토스페이먼츠' },
  { value: 'KAKAO', label: '카카오페이' },
  { value: 'NAVER', label: '네이버페이' },
  { value: 'KG_INICIS', label: 'KG이니시스' },
  { value: 'NHN_KCP', label: 'NHN KCP' }
];

// 테스트 시나리오
export const TEST_SCENARIOS = [
  { 
    amount: 50000, 
    method: 'CARD', 
    provider: 'TOSS', 
    description: '카드 결제 테스트' 
  },
  { 
    amount: 100000, 
    method: 'BANK_TRANSFER', 
    provider: 'KAKAO', 
    description: '계좌이체 테스트' 
  },
  { 
    amount: 200000, 
    method: 'CARD', 
    provider: 'KAKAO', 
    description: '간편결제 테스트' 
  }
];

// 결제 상태 옵션
export const PAYMENT_STATUSES = [
  { value: 'APPROVED', label: '승인' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'REFUNDED', label: '환불' },
  { value: 'FAILED', label: '실패' }
];

// 버튼 텍스트
export const BUTTON_TEXT = {
  CREATE_PAYMENT: '결제 생성',
  SCENARIOS: '시나리오 테스트',
  STATUS_UPDATE: '상태 변경',
  WEBHOOK_TEST: 'Webhook 테스트',
  STATISTICS: '통계 조회',
  HEALTH_CHECK: '헬스 체크',
  CLEAR_RESULTS: '결과 초기화',
  BULK_CREATE: '대량 생성',
  DEPOSIT_CONFIRM: '입금 확인'
};

// 폼 라벨
export const FORM_LABELS = {
  PAYMENT_METHOD: '결제 방법',
  PAYMENT_PROVIDER: '결제 대행사',
  AMOUNT: '결제 금액',
  PAYER_ID: '결제자 ID',
  RECIPIENT_ID: '수취인 ID',
  BRANCH_ID: '지점 ID',
  DESCRIPTION: '설명',
  TIMEOUT_MINUTES: '타임아웃 (분)'
};

// 플레이스홀더
export const PLACEHOLDERS = {
  AMOUNT: '결제 금액을 입력하세요',
  PAYER_ID: '결제자 ID를 입력하세요',
  RECIPIENT_ID: '수취인 ID를 입력하세요',
  BRANCH_ID: '지점 ID를 입력하세요',
  DESCRIPTION: '결제 설명을 입력하세요',
  TIMEOUT_MINUTES: '타임아웃 시간을 입력하세요'
};

// 메시지
export const MESSAGES = {
  SUCCESS: {
    PAYMENT_CREATED: '결제가 성공적으로 생성되었습니다.',
    SCENARIOS_COMPLETED: '시나리오 테스트가 완료되었습니다.',
    STATUS_UPDATED: '결제 상태가 업데이트되었습니다.',
    WEBHOOK_PROCESSED: 'Webhook이 처리되었습니다.',
    STATISTICS_LOADED: '통계가 로드되었습니다.',
    HEALTH_CHECK_PASSED: '헬스 체크가 성공했습니다.',
    RESULTS_CLEARED: '결과가 초기화되었습니다.'
  },
  ERROR: {
    PAYMENT_CREATION_FAILED: '결제 생성에 실패했습니다.',
    SCENARIOS_FAILED: '시나리오 테스트에 실패했습니다.',
    STATUS_UPDATE_FAILED: '상태 업데이트에 실패했습니다.',
    WEBHOOK_FAILED: 'Webhook 처리에 실패했습니다.',
    STATISTICS_FAILED: '통계 로드에 실패했습니다.',
    HEALTH_CHECK_FAILED: '헬스 체크에 실패했습니다.',
    NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
    INVALID_INPUT: '유효하지 않은 입력입니다.'
  },
  CONFIRM: {
    CLEAR_RESULTS: '모든 결과를 초기화하시겠습니까?',
    BULK_CREATE: '대량 결제를 생성하시겠습니까?',
    STATUS_UPDATE: '결제 상태를 변경하시겠습니까?'
  }
};

// 페이지 제목
export const PAGE_TITLES = {
  MAIN: '결제 시스템 테스트',
  CREATE_PAYMENT: '결제 생성 테스트',
  SCENARIOS: '시나리오 테스트',
  STATUS_UPDATE: '상태 변경 테스트',
  WEBHOOK: 'Webhook 테스트',
  STATISTICS: '통계 테스트',
  HEALTH: '헬스 체크'
};

// 결과 타입
export const RESULT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// 테스트 타입
export const TEST_TYPES = {
  CREATE_PAYMENT: 'create_payment',
  SCENARIOS: 'scenarios',
  STATUS_UPDATE: 'status_update',
  WEBHOOK: 'webhook',
  STATISTICS: 'statistics',
  HEALTH: 'health'
};
