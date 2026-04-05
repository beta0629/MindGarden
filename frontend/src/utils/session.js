/**
 * 세션 관리 유틸리티
/**
 * 로그인 상태, 사용자 정보, 토큰 관리
 */

import { storage } from './common';
import { getLegacyDashboardPath } from './dashboardUtils';
import { redirectToLoginPageOnce } from './sessionRedirect';

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
 * 역할별 대시보드 경로 매핑 (중앙 관리)
/**
 * 
/**
 * @deprecated 이 상수는 완전히 제거 예정입니다. 더 이상 사용하지 마세요.
/**
 * 대신 `dashboardUtils.js`의 `getLegacyDashboardPath()` 또는 `redirectToDynamicDashboard()`를 사용하세요.
/**
 * 
/**
 * @see {@link ../utils/dashboardUtils.js} - 동적 대시보드 라우팅 유틸리티
/**
 * 
/**
 * @private 이 상수는 내부적으로만 사용되며, 외부에서는 접근하지 마세요.
 */
const ROLE_DASHBOARD_MAP = {
  'CLIENT': '/client/dashboard',
  'CONSULTANT': '/consultant/dashboard',
  'ADMIN': '/admin/dashboard',
  'BRANCH_SUPER_ADMIN': '/super_admin/dashboard',
  'BRANCH_MANAGER': '/admin/dashboard',
  'HQ_ADMIN': '/admin/dashboard',
  'SUPER_HQ_ADMIN': '/admin/dashboard',
  'HQ_MASTER': '/admin/dashboard',
  'HQ_SUPER_ADMIN': '/admin/dashboard'
};

/**
 * 역할별 대시보드 경로 가져오기 (공통 함수)
/**
 * 
/**
 * @deprecated 이 함수는 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
/**
 * 대신 `dashboardUtils.js`의 `getLegacyDashboardPath()` 또는 `redirectToDynamicDashboard()`를 사용하세요.
/**
 * 
/**
 * @param {string} role 역할
/**
 * @returns {string} 대시보드 경로
/**
 * @see {@link ../utils/dashboardUtils.js} - 동적 대시보드 라우팅 유틸리티
 */
export const getDashboardPath = (role) => {
  // 내부적으로 dashboardUtils의 함수를 사용 (중복 제거)
  return getLegacyDashboardPath(role);
};

/**
 * 현재 사용자의 대시보드 경로 가져오기
 */
export const getCurrentUserDashboardPath = () => {
  const user = getCurrentUser();
  return getDashboardPath(user?.role);
};

/**
 * 공통 리다이렉션 함수 - React Router와 window.location 모두 지원
/**
 * 
/**
 * @deprecated 이 함수는 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
/**
 * 대신 `dashboardUtils.js`의 `redirectToDynamicDashboard()`를 사용하세요.
/**
 * 
/**
 * @param {string} userRole 사용자 역할
/**
 * @param {Function|null} navigate React Router navigate 함수 (선택)
/**
 * @see {@link ../utils/dashboardUtils.js} - 동적 대시보드 라우팅 유틸리티
 */
export const redirectToDashboardWithFallback = (userRole, navigate = null) => {
  try {
    const dashboardPath = getDashboardPath(userRole);
    console.warn('⚠️ redirectToDashboardWithFallback()는 deprecated입니다. redirectToDynamicDashboard()를 사용하세요.');
    console.log('🎯 공통 리다이렉션 시작:', {
      role: userRole,
      path: dashboardPath
    });
    
    // 1차: React Router navigate (navigate 함수가 있는 경우)
    if (navigate && typeof navigate === 'function') {
      try {
        navigate(dashboardPath, { replace: true });
        console.log('✅ React Router navigate 실행됨');
      } catch (error) {
        console.error('❌ React Router navigate 실패:', error);
      }
    }
    
    // 2차: window.location (즉시 실행)
    setTimeout(() => {
      console.log('🎯 window.location 리다이렉트 실행:', dashboardPath);
      window.location.href = dashboardPath;
    }, 100);
    
    // 3차: 강제 리다이렉트 (최종 백업)
    setTimeout(() => {
      console.log('🎯 강제 리다이렉트 실행:', dashboardPath);
      window.location.replace(dashboardPath);
    }, 1000);
    
  } catch (error) {
    console.error('❌ 공통 리다이렉션 오류:', error);
    // 기본 경로로 리다이렉트
    if (navigate && typeof navigate === 'function') {
      navigate('/client/dashboard', { replace: true });
    } else {
      window.location.href = '/client/dashboard';
    }
  }
};

/**
 * 로그인 후 대시보드로 리다이렉트 (기존 호환성 유지)
/**
 * 
/**
 * @deprecated 이 함수는 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
/**
 * 대신 `dashboardUtils.js`의 `redirectToDynamicDashboard()`를 사용하세요.
/**
 * 
/**
 * @param {Object} userInfo 사용자 정보
/**
 * @see {@link ../utils/dashboardUtils.js} - 동적 대시보드 라우팅 유틸리티
 */
export const redirectToDashboard = (userInfo) => {
  console.warn('⚠️ redirectToDashboard()는 deprecated입니다. redirectToDynamicDashboard()를 사용하세요.');
  redirectToDashboardWithFallback(userInfo?.role);
};

/**
 * 로그아웃 처리
 */
export const logout = () => {
  try {
    // 세션 정리
    clearSession();
    
    redirectToLoginPageOnce();
    
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
