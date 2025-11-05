/**
 * API 설정 파일
 * API Base URL 및 기본 설정
 */

export const API_BASE_URL = 'https://m-garden.co.kr';
export const API_TIMEOUT = 10000;

// API 상태 코드
export const API_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// API 에러 메시지
export const API_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
};

