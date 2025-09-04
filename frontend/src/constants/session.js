/**
 * 세션 관리 상수
 * 세션 확인 간격, 타임아웃 등 세션 관련 설정
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 세션 확인 간격 (밀리초)
export const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5분

// 세션 확인 타임아웃 (밀리초)
export const SESSION_CHECK_TIMEOUT = 10 * 1000; // 10초

// 로그인 후 세션 확인 지연 시간 (밀리초)
export const LOGIN_SESSION_CHECK_DELAY = 100; // 100ms

// 기존 세션 확인 지연 시간 (밀리초) - 로그인 페이지에서 세션 체크
export const EXISTING_SESSION_CHECK_DELAY = 0; // 즉시 실행

// 정기 세션 확인 간격 (밀리초)
export const PERIODIC_SESSION_CHECK_INTERVAL = 10 * 60 * 1000; // 10분

// 세션 만료 시간 (밀리초)
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 세션 키 상수
export const SESSION_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'user',
  LOGIN_TIME: 'loginTime',
  SESSION_EXPIRY: 'sessionExpiry'
};

// 역할별 대시보드 경로
export const DASHBOARD_PATHS = {
  CLIENT: '/client/dashboard',
  CONSULTANT: '/consultant/dashboard',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard'
};

// 기본 대시보드 경로
export const DEFAULT_DASHBOARD_PATH = DASHBOARD_PATHS.CLIENT;
