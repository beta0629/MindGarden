/**
 * 세션 관리 Context
 * React Native용 세션 관리
 * 
 * 웹의 frontend/src/contexts/SessionContext.js를 참고하여 모바일용으로 변환
 * 
 * 주요 변경사항:
 * - localStorage → AsyncStorage
 * - window.location → React Navigation
 * - 쿠키 세션 체크 → 토큰 기반 세션 체크
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../api/client';
import { AUTH_API } from '../api/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SessionManager from '../services/SessionManager';

// 세션 상태 타입 정의
const SessionState = {
  user: null,
  isLoading: false,
  isLoggedIn: false,
  error: null,
};

// 액션 타입 정의
const SessionActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_SESSION: 'CLEAR_SESSION',
  SET_LOGGED_IN: 'SET_LOGGED_IN',
};

// 리듀서 함수
const sessionReducer = (state, action) => {
  switch (action.type) {
    case SessionActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    
    case SessionActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoggedIn: action.payload !== null,
        error: null,
      };
    
    case SessionActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case SessionActionTypes.CLEAR_SESSION:
      return {
        ...state,
        user: null,
        isLoggedIn: false,
        error: null,
      };
    
    case SessionActionTypes.SET_LOGGED_IN:
      return {
        ...state,
        isLoggedIn: action.payload,
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
  const stateRef = useRef(state);
  
  // state가 변경될 때마다 ref 업데이트
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 초기 마운트 시 AsyncStorage에서 사용자 정보 복원
  useEffect(() => {
    const loadSession = async () => {
      try {
        await SessionManager.init();
        const { user, accessToken } = SessionManager.getState();

        if (user && accessToken) {
          dispatch({ type: SessionActionTypes.SET_USER, payload: user });
          dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
        }
      } catch (error) {
        console.error('세션 로드 실패:', error);
      }
    };
    
    loadSession();
  }, []);

  // 세션 체크 함수
  const checkSession = useCallback(
    async (force = false) => {
      try {
        await SessionManager.init();
        const { accessToken } = SessionManager.getState();

        if (!accessToken && !force) {
          return false;
        }

        dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });

        const response = await apiGet(AUTH_API.GET_CURRENT_USER);

        if (response && response.user) {
          await SessionManager.setSession({ user: response.user });
          dispatch({ type: SessionActionTypes.SET_USER, payload: response.user });
          dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
          return true;
        }

        await logout();
        return false;
      } catch (error) {
        console.error('세션 체크 실패:', error);
        if (error.status === 401 || error.status === 403) {
          await logout();
        }
        return false;
      } finally {
        dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
      }
    },
    [logout]
  );

  // 로그인 함수
  const login = useCallback(async () => {
    try {
      await SessionManager.init();
      const { user } = SessionManager.getState();

      if (user) {
        dispatch({ type: SessionActionTypes.SET_USER, payload: user });
        dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
        return { success: true, user };
      }

      return { success: false };
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      try {
        const { apiPost } = await import('../api/client');
        const { AUTH_API: AUTH_ENDPOINTS } = await import('../api/endpoints');
        await apiPost(AUTH_ENDPOINTS.LOGOUT);
      } catch (apiError) {
        console.log('로그아웃 API 호출 실패 (무시됨):', apiError);
      }

      await SessionManager.clearSession({ reason: 'manual-logout', broadcast: true });
      await AsyncStorage.removeItem('fcm_token');
      dispatch({ type: SessionActionTypes.CLEAR_SESSION });

      console.log('✅ 로그아웃 완료');
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      try {
        await SessionManager.clearSession({ reason: 'manual-logout-fallback', broadcast: true });
        await AsyncStorage.removeItem('fcm_token');
        dispatch({ type: SessionActionTypes.CLEAR_SESSION });
      } catch (cleanupError) {
        console.error('세션 정리 실패:', cleanupError);
      }
      return false;
    }
  }, []);

  const value = {
    ...state,
    checkSession,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// 세션 Context Hook
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;
