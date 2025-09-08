/**
 * 통합 테스트 관련 상수
 * CSS 클래스, JavaScript 변수, 메시지 등을 중앙에서 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */

// API 엔드포인트
export const INTEGRATION_TEST_API = {
  RUN_FULL_TEST: '/api/integration-test/run-full-test',
  HEALTH_CHECK: '/api/integration-test/health',
  PERFORMANCE_TEST: '/api/integration-test/performance-test',
  SECURITY_TEST: '/api/integration-test/security-test'
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

// 버튼 텍스트
export const BUTTON_TEXT = {
  RUN_FULL_TEST: '전체 통합 테스트',
  HEALTH_CHECK: '시스템 헬스 체크',
  PERFORMANCE_TEST: '성능 테스트',
  SECURITY_TEST: '보안 테스트',
  CLEAR_RESULTS: '결과 초기화'
};

// 페이지 제목
export const PAGE_TITLES = {
  MAIN: '시스템 통합 테스트',
  FULL_TEST: '전체 통합 테스트',
  HEALTH_CHECK: '시스템 헬스 체크',
  PERFORMANCE_TEST: '성능 테스트',
  SECURITY_TEST: '보안 테스트'
};

// 메시지
export const MESSAGES = {
  SUCCESS: {
    FULL_TEST_COMPLETED: '전체 시스템 통합 테스트가 성공적으로 완료되었습니다.',
    HEALTH_CHECK_PASSED: '시스템 헬스 체크가 성공했습니다.',
    PERFORMANCE_TEST_COMPLETED: '성능 테스트가 완료되었습니다.',
    SECURITY_TEST_COMPLETED: '보안 테스트가 완료되었습니다.'
  },
  ERROR: {
    FULL_TEST_FAILED: '통합 테스트 실행 중 오류가 발생했습니다.',
    HEALTH_CHECK_FAILED: '헬스 체크 중 오류가 발생했습니다.',
    PERFORMANCE_TEST_FAILED: '성능 테스트 중 오류가 발생했습니다.',
    SECURITY_TEST_FAILED: '보안 테스트 중 오류가 발생했습니다.',
    NETWORK_ERROR: '네트워크 오류가 발생했습니다.'
  },
  LOADING: {
    RUNNING_TEST: '테스트 실행 중...',
    CHECKING_HEALTH: '시스템 상태 확인 중...',
    RUNNING_PERFORMANCE: '성능 측정 중...',
    RUNNING_SECURITY: '보안 검증 중...'
  }
};

// 테스트 타입
export const TEST_TYPES = {
  FULL_INTEGRATION: 'full_integration',
  HEALTH_CHECK: 'health_check',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
};

// 시스템 상태
export const SYSTEM_STATUS = {
  HEALTHY: 'HEALTHY',
  UNHEALTHY: 'UNHEALTHY',
  WARNING: 'WARNING'
};

// 서비스 상태
export const SERVICE_STATUS = {
  OK: 'OK',
  ERROR: 'ERROR',
  WARNING: 'WARNING'
};

// 테스트 결과 상태
export const TEST_RESULT_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 성능 테스트 메트릭
export const PERFORMANCE_METRICS = {
  AVERAGE_RESPONSE_TIME: 'averageResponseTime',
  MAX_RESPONSE_TIME: 'maxResponseTime',
  MIN_RESPONSE_TIME: 'minResponseTime',
  RESPONSE_TIMES: 'responseTimes'
};

// 보안 테스트 항목
export const SECURITY_TESTS = {
  ENCRYPTION: 'encryptionWorking',
  ROLE_VALIDATION: 'roleValidationWorking',
  SECURITY_SCORE: 'securityScore'
};

// 통합 테스트 항목
export const INTEGRATION_TESTS = {
  USER_MANAGEMENT: '사용자 관리 시스템',
  CONSULTANT_CLIENT_MAPPING: '상담사-내담자 매핑 시스템',
  SCHEDULE_MANAGEMENT: '스케줄 관리 시스템',
  PAYMENT_SYSTEM: '결제 시스템',
  PERSONAL_DATA_ENCRYPTION: '개인정보 암호화 시스템',
  ROLE_MANAGEMENT: '역할 관리 시스템'
};
