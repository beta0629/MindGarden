/**
 * 세션 관리 상수
/**
 * 세션 확인 간격, 타임아웃 등 세션 관련 설정
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

// 세션 확인 간격 (밀리초)
export const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5분

// 세션 확인 타임아웃 (밀리초)
export const SESSION_CHECK_TIMEOUT = 10 * 1000; // 10초

// 로그인 후 세션 확인 지연 시간 (밀리초)
export const LOGIN_SESSION_CHECK_DELAY = 100; // 100ms

// 기존 세션 확인 지연 시간 (밀리초) - 로그인 페이지에서 세션 체크
export const EXISTING_SESSION_CHECK_DELAY = 500; // OAuth2 콜백 후 세션 쿠키 설정 대기

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

// 역할별 대시보드 경로 (권한 격리: 링크만으로 타 역할 대시보드 접근 방지용)
export const DASHBOARD_PATHS = {
  CLIENT: '/client/dashboard',
  CONSULTANT: '/consultant/dashboard',
  ADMIN: '/admin/dashboard',
  STAFF: '/admin/dashboard',
  BRANCH_SUPER_ADMIN: '/super_admin/dashboard'
};

/** 역할에 맞는 대시보드 경로 반환 (세션/권한 체크 후 리다이렉트용) */
export function getDashboardPathByRole(role) {
  if (!role) return DASHBOARD_PATHS.CLIENT;
  const path = DASHBOARD_PATHS[role];
  return path || DASHBOARD_PATHS.ADMIN;
}

// 기본 대시보드 경로
export const DEFAULT_DASHBOARD_PATH = DASHBOARD_PATHS.CLIENT;
