/**
 * 세션 관리 유틸리티
 * 로그인 상태, 사용자 정보, 토큰 관리
 */

import { storage } from './common';

// 세션 키 상수
const SESSION_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'user',
  LOGIN_TIME: 'loginTime',
  SESSION_EXPIRY: 'sessionExpiry'
};

// 세션 만료 시간 (24시간)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * 세션 초기화
 */
export const initializeSession = () => {
  // 세션 만료 확인
  if (isSessionExpired()) {
    clearSession();
    return false;
  }
  
  // 사용자 정보 유효성 확인
  const user = getCurrentUser();
  if (!user || !user.id) {
    clearSession();
    return false;
  }
  
  return true;
};

/**
 * 로그인 세션 설정
 */
export const setLoginSession = (userInfo, tokens) => {
  try {
    // 기존 JWT 토큰 제거 (잘못 저장된 것들)
    storage.remove(SESSION_KEYS.ACCESS_TOKEN);
    storage.remove(SESSION_KEYS.REFRESH_TOKEN);
    
    // 사용자 정보 저장
    storage.set(SESSION_KEYS.USER_INFO, userInfo);
    
    // 로그인 시간 설정
    const loginTime = Date.now();
    const sessionExpiry = loginTime + SESSION_DURATION;
    storage.set(SESSION_KEYS.LOGIN_TIME, loginTime);
    storage.set(SESSION_KEYS.SESSION_EXPIRY, sessionExpiry);
    
    // 토큰 저장 (JWT는 raw string으로 저장)
    if (tokens.accessToken) {
      storage.setRaw(SESSION_KEYS.ACCESS_TOKEN, tokens.accessToken);
    }
    if (tokens.refreshToken) {
      storage.setRaw(SESSION_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
    
    console.log('로그인 세션 설정 완료:', {
      userId: userInfo.id,
      role: userInfo.role,
      loginTime: new Date(loginTime).toLocaleString(),
      expiryTime: new Date(sessionExpiry).toLocaleString()
    });
    
    return true;
  } catch (error) {
    console.error('세션 설정 오류:', error);
    return false;
  }
};

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = () => {
  try {
    const user = storage.get(SESSION_KEYS.USER_INFO);
    return user || null;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 현재 사용자 역할 가져오기
 */
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * 액세스 토큰 가져오기
 */
export const getAccessToken = () => {
  try {
    return storage.get(SESSION_KEYS.ACCESS_TOKEN) || null;
  } catch (error) {
    console.error('액세스 토큰 조회 오류:', error);
    return null;
  }
};

/**
 * 리프레시 토큰 가져오기
 */
export const getRefreshToken = () => {
  try {
    return storage.get(SESSION_KEYS.REFRESH_TOKEN) || null;
  } catch (error) {
    console.error('리프레시 토큰 조회 오류:', error);
    return null;
  }
};

/**
 * 로그인 상태 확인
 */
export const isLoggedIn = () => {
  try {
    const user = getCurrentUser();
    const token = getAccessToken();
    const isExpired = isSessionExpired();
    
    return !!(user && token && !isExpired);
  } catch (error) {
    console.error('로그인 상태 확인 오류:', error);
    return false;
  }
};

/**
 * 세션 만료 확인
 */
export const isSessionExpired = () => {
  try {
    const expiry = storage.get(SESSION_KEYS.SESSION_EXPIRY);
    if (!expiry) return true;
    
    const now = Date.now();
    const isExpired = now > expiry;
    
    if (isExpired) {
      console.log('세션이 만료되었습니다:', {
        currentTime: new Date(now).toLocaleString(),
        expiryTime: new Date(expiry).toLocaleString()
      });
    }
    
    return isExpired;
  } catch (error) {
    console.error('세션 만료 확인 오류:', error);
    return true;
  }
};

/**
 * 세션 갱신
 */
export const refreshSession = (newTokens) => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    
    // 새로운 토큰으로 세션 갱신
    if (newTokens.accessToken) {
      storage.set(SESSION_KEYS.ACCESS_TOKEN, newTokens.accessToken);
    }
    if (newTokens.refreshToken) {
      storage.set(SESSION_KEYS.REFRESH_TOKEN, newTokens.refreshToken);
    }
    
    // 세션 시간 갱신
    const loginTime = Date.now();
    const sessionExpiry = loginTime + SESSION_DURATION;
    storage.set(SESSION_KEYS.LOGIN_TIME, loginTime);
    storage.set(SESSION_KEYS.SESSION_EXPIRY, sessionExpiry);
    
    console.log('세션 갱신 완료:', {
      userId: user.id,
      role: user.role,
      refreshTime: new Date(loginTime).toLocaleString()
    });
    
    return true;
  } catch (error) {
    console.error('세션 갱신 오류:', error);
    return false;
  }
};

/**
 * 세션 정리 (로그아웃)
 */
export const clearSession = () => {
  try {
    Object.values(SESSION_KEYS).forEach(key => {
      storage.remove(key);
    });
    
    console.log('세션 정리 완료');
    return true;
  } catch (error) {
    console.error('세션 정리 오류:', error);
    return false;
  }
};

/**
 * 세션 강제 초기화 (기존 잘못된 데이터 제거)
 */
export const forceClearSession = () => {
  try {
    // 모든 세션 관련 데이터 제거
    localStorage.removeItem(SESSION_KEYS.USER_INFO);
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(SESSION_KEYS.LOGIN_TIME);
    localStorage.removeItem(SESSION_KEYS.SESSION_EXPIRY);
    
    console.log('세션 강제 초기화 완료');
    return true;
  } catch (error) {
    console.error('세션 초기화 오류:', error);
    return false;
  }
};

/**
 * 역할별 대시보드 경로 가져오기
 */
export const getDashboardPath = (role) => {
  if (!role) return '/client/dashboard';
  
  const roleMap = {
    'CLIENT': '/client/dashboard',
    'CONSULTANT': '/consultant/dashboard',
    'ADMIN': '/admin/dashboard',
    'SUPER_ADMIN': '/super_admin/dashboard'
  };
  
  return roleMap[role.toUpperCase()] || '/client/dashboard';
};

/**
 * 현재 사용자의 대시보드 경로 가져오기
 */
export const getCurrentUserDashboardPath = () => {
  const user = getCurrentUser();
  return getDashboardPath(user?.role);
};

/**
 * 로그인 후 대시보드로 리다이렉트
 */
export const redirectToDashboard = (userInfo) => {
  try {
    const dashboardPath = getDashboardPath(userInfo?.role);
    console.log('대시보드로 리다이렉트:', {
      userId: userInfo?.id,
      role: userInfo?.role,
      path: dashboardPath
    });
    
    window.location.href = dashboardPath;
  } catch (error) {
    console.error('대시보드 리다이렉트 오류:', error);
    // 기본 경로로 리다이렉트
    window.location.href = '/client/dashboard';
  }
};

/**
 * 로그아웃 처리
 */
export const logout = () => {
  try {
    // 세션 정리
    clearSession();
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
    
    console.log('로그아웃 완료');
    return true;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return false;
  }
};

/**
 * 세션 정보 로깅 (디버깅용)
 */
export const logSessionInfo = () => {
  try {
    const user = getCurrentUser();
    const token = getAccessToken();
    const isExpired = isSessionExpired();
    const loginTime = storage.get(SESSION_KEYS.LOGIN_TIME);
    const expiryTime = storage.get(SESSION_KEYS.SESSION_EXPIRY);
    
    console.log('=== 세션 정보 ===');
    console.log('사용자:', user);
    console.log('토큰 존재:', !!token);
    console.log('로그인 시간:', loginTime ? new Date(loginTime).toLocaleString() : '없음');
    console.log('만료 시간:', expiryTime ? new Date(expiryTime).toLocaleString() : '없음');
    console.log('세션 만료:', isExpired);
    console.log('로그인 상태:', isLoggedIn());
    console.log('================');
  } catch (error) {
    console.error('세션 정보 로깅 오류:', error);
  }
};

export default {
  initializeSession,
  setLoginSession,
  getCurrentUser,
  getCurrentUserRole,
  getAccessToken,
  getRefreshToken,
  isLoggedIn,
  isSessionExpired,
  refreshSession,
  clearSession,
  forceClearSession, // 추가된 함수
  getDashboardPath,
  getCurrentUserDashboardPath,
  redirectToDashboard,
  logout,
  logSessionInfo
};
