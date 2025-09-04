import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { sessionManager } from '../utils/sessionManager';
import { authAPI } from '../utils/ajax';
import { SESSION_CHECK_INTERVAL } from '../constants/session';

// 세션 상태 타입 정의
const SessionState = {
  user: null,
  sessionInfo: null,
  isLoading: false,
  isLoggedIn: false,
  lastCheckTime: 0,
  error: null,
  isModalOpen: false // 모달 상태 추가
};

// 액션 타입 정의
const SessionActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_SESSION_INFO: 'SET_SESSION_INFO',
  SET_ERROR: 'SET_ERROR',
  CLEAR_SESSION: 'CLEAR_SESSION',
  SET_LAST_CHECK_TIME: 'SET_LAST_CHECK_TIME',
  SET_MODAL_OPEN: 'SET_MODAL_OPEN' // 모달 상태 액션 추가
};

// 리듀서 함수
const sessionReducer = (state, action) => {
  switch (action.type) {
    case SessionActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    
    case SessionActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoggedIn: action.payload !== null,
        error: null
      };
    
    case SessionActionTypes.SET_SESSION_INFO:
      return {
        ...state,
        sessionInfo: action.payload
      };
    
    case SessionActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case SessionActionTypes.CLEAR_SESSION:
      return {
        ...state,
        user: null,
        sessionInfo: null,
        isLoggedIn: false,
        error: null
      };
    
    case SessionActionTypes.SET_LAST_CHECK_TIME:
      return {
        ...state,
        lastCheckTime: action.payload
      };
    
    case SessionActionTypes.SET_MODAL_OPEN:
      return {
        ...state,
        isModalOpen: action.payload
      };
    
    default:
      return state;
  }
};

// 컨텍스트 생성
const SessionContext = createContext();

// 세션 프로바이더 컴포넌트
export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, SessionState);

  // 세션 체크 함수 (useCallback으로 메모이제이션)
  const checkSession = useCallback(async (force = false) => {
    const now = Date.now();
    
    // 모달이 열려있으면 세션 체크 스킵 (모달 닫힘 방지)
    if (!force && state.isModalOpen) {
      console.log('🔄 세션 체크 스킵 (모달 열림)');
      return state.isLoggedIn;
    }
    
    // 강제 확인이 아니고, 이미 체크 중이거나 최근에 체크했으면 스킵
    if (!force && (state.isLoading || (now - state.lastCheckTime < SESSION_CHECK_INTERVAL))) {
      console.log('🔄 세션 체크 스킵 (중복 방지)');
      return state.isLoggedIn;
    }

    dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
    dispatch({ type: SessionActionTypes.SET_LAST_CHECK_TIME, payload: now });

    try {
      const isLoggedIn = await sessionManager.checkSession(force);
      const user = sessionManager.getUser();
      const sessionInfo = sessionManager.getSessionInfo();

      if (isLoggedIn && user) {
        // 기존 사용자 정보가 있으면 role 정보 보존
        const currentUser = state.user;
        if (currentUser && currentUser.role && !user.role) {
          console.log('🔄 기존 사용자 role 정보 보존:', currentUser.role);
          user.role = currentUser.role;
        }
        
        dispatch({ type: SessionActionTypes.SET_USER, payload: user });
        if (sessionInfo) {
          dispatch({ type: SessionActionTypes.SET_SESSION_INFO, payload: sessionInfo });
        }
        console.log('✅ 중앙 세션 확인 완료:', user);
      } else {
        // 세션 확인 실패 시 기존 사용자 정보가 있으면 보존
        if (state.user && state.user.role) {
          console.log('🔄 세션 확인 실패했지만 기존 사용자 정보 보존:', state.user.role);
          // 기존 사용자 정보 유지, 세션만 클리어하지 않음
          return state.isLoggedIn; // 기존 로그인 상태 유지
        } else {
          dispatch({ type: SessionActionTypes.CLEAR_SESSION });
          console.log('ℹ️ 중앙 세션: 로그인되지 않은 상태');
        }
      }

      return isLoggedIn;
    } catch (error) {
      console.error('❌ 중앙 세션 확인 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
    }
  }, [state.isModalOpen, state.isLoading, state.lastCheckTime, state.user]);

  // 로그인 함수 (API 호출 포함)
  const login = async (loginData) => {
    try {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
      
      console.log('🔐 중앙 세션 로그인 시작:', loginData);
      
      // API 호출
      const response = await authAPI.login(loginData);
      console.log('📡 로그인 API 응답:', response);
      
      if (response && response.success) {
        // sessionManager에 사용자 정보 설정
        sessionManager.setUser(response.user, {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        });
        
        // 상태 즉시 업데이트 (로그인 성공 시)
        dispatch({ type: SessionActionTypes.SET_USER, payload: response.user });
        dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
        dispatch({ type: SessionActionTypes.SET_LOADING, payload: false }); // 로딩 즉시 해제
        
        // 잠시 후 서버 세션 확인 (쿠키 설정 시간 확보)
        setTimeout(async () => {
          try {
            console.log('🔄 로그인 후 세션 확인 시작...');
            await checkSession(true);
            console.log('✅ 로그인 후 세션 확인 완료');
          } catch (error) {
            console.error('❌ 로그인 후 세션 확인 실패:', error);
          }
        }, 500); // 1초 → 500ms로 단축
        
        console.log('✅ 중앙 세션 로그인 완료:', response.user);
        return { success: true, user: response.user };
      } else {
        console.log('❌ 로그인 실패:', response);
        return { success: false, message: response?.message || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('❌ 중앙 세션 로그인 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return { success: false, message: error.message };
    }
  };

  // 테스트 로그인 함수
  const testLogin = async (userInfo, tokens = null) => {
    try {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
      
      console.log('🧪 테스트 로그인 시작:', userInfo);
      
      // sessionManager에 사용자 정보 설정
      sessionManager.setUser(userInfo, tokens);
      
      // 상태 즉시 업데이트 (테스트 로그인 성공 시)
      dispatch({ type: SessionActionTypes.SET_USER, payload: userInfo });
      dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: false }); // 로딩 즉시 해제
      
      // 잠시 후 서버 세션 확인 (쿠키 설정 시간 확보)
      setTimeout(async () => {
        try {
          console.log('🔄 테스트 로그인 후 세션 확인 시작...');
          await checkSession(true);
          console.log('✅ 테스트 로그인 후 세션 확인 완료');
        } catch (error) {
          console.error('❌ 테스트 로그인 후 세션 확인 실패:', error);
        }
      }, 500); // 1초 → 500ms로 단축
      
      console.log('✅ 테스트 로그인 완료:', userInfo);
      return true;
    } catch (error) {
      console.error('❌ 테스트 로그인 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
      
      // sessionManager 로그아웃
      await sessionManager.logout();
      
      // 상태 초기화
      dispatch({ type: SessionActionTypes.CLEAR_SESSION });
      
      console.log('✅ 중앙 세션 로그아웃 완료');
      return true;
    } catch (error) {
      console.error('❌ 중앙 세션 로그아웃 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  };

  // 주기적 세션 체크
  useEffect(() => {
    // 초기 세션 체크
    checkSession();

    // 주기적 세션 체크 설정
    const interval = setInterval(() => {
      if (!state.isLoading) {
        checkSession();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkSession, state.isLoading]);

  // 자동 리다이렉트 로직 제거 (무한루프 방지)
  // OAuth2 콜백에서만 리다이렉트 처리

  // sessionManager 변경사항 리스너
  useEffect(() => {
    const handleSessionChange = () => {
      const user = sessionManager.getUser();
      const sessionInfo = sessionManager.getSessionInfo();
      
      if (user) {
        dispatch({ type: SessionActionTypes.SET_USER, payload: user });
        if (sessionInfo) {
          dispatch({ type: SessionActionTypes.SET_SESSION_INFO, payload: sessionInfo });
        }
      } else {
        dispatch({ type: SessionActionTypes.CLEAR_SESSION });
      }
    };

    // sessionManager 리스너 등록
    sessionManager.addListener(handleSessionChange);

    return () => {
      sessionManager.removeListener(handleSessionChange);
    };
  }, []);

  // 모달 상태 관리 함수들 (useCallback으로 메모이제이션)
  const setModalOpen = useCallback((isOpen) => {
    dispatch({ type: SessionActionTypes.SET_MODAL_OPEN, payload: isOpen });
  }, []);

  const value = {
    // 상태
    user: state.user,
    sessionInfo: state.sessionInfo,
    isLoading: state.isLoading,
    isLoggedIn: state.isLoggedIn,
    error: state.error,
    isModalOpen: state.isModalOpen,
    
    // 액션
    checkSession,
    login,
    testLogin,
    logout,
    setModalOpen,
    
    // 유틸리티
    hasRole: (role) => state.user?.role === role,
    hasAnyRole: (roles) => roles.includes(state.user?.role),
    isAdmin: () => state.user?.role === 'ADMIN',
    isConsultant: () => state.user?.role === 'CONSULTANT',
    isClient: () => state.user?.role === 'CLIENT'
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// 커스텀 훅
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// 세션 액션 타입 내보내기
export { SessionActionTypes };
