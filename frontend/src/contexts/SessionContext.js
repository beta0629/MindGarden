import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { CONSTANTS } from '../constants/magicNumbers';
import { sessionManager } from '../utils/sessionManager';
import { authAPI } from '../utils/ajax';
import { SESSION_CHECK_INTERVAL } from '../constants/session';
import { RoleUtils, USER_ROLES } from '../constants/roles';

// 세션 상태 타입 정의
const SessionState = {
  user: null,
  sessionInfo: null,
  isLoading: false,
  isLoggedIn: false,
  lastCheckTime: 0, // 초기값을 0으로 설정
  error: null,
  isModalOpen: false, // 모달 상태 추가
  duplicateLoginModal: {
    isOpen: false,
    message: '',
    loginData: null
  }, // 중복 로그인 확인 모달 상태 추가
  // branchMappingModal 제거됨 - 브랜치 코드 제거 정책
};

// 액션 타입 정의
const SessionActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_SESSION_INFO: 'SET_SESSION_INFO',
  SET_ERROR: 'SET_ERROR',
  CLEAR_SESSION: 'CLEAR_SESSION',
  SET_LAST_CHECK_TIME: 'SET_LAST_CHECK_TIME',
  SET_MODAL_OPEN: 'SET_MODAL_OPEN', // 모달 상태 액션 추가
  SET_DUPLICATE_LOGIN_MODAL: 'SET_DUPLICATE_LOGIN_MODAL', // 중복 로그인 모달 액션 추가
  // SET_BRANCH_MAPPING_MODAL 제거됨 - 브랜치 코드 제거 정책
  SET_LOGGED_IN: 'SET_LOGGED_IN' // 로그인 상태 액션 추가
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
    
    case SessionActionTypes.SET_DUPLICATE_LOGIN_MODAL:
      return {
        ...state,
        duplicateLoginModal: action.payload
      };
    
    // SET_BRANCH_MAPPING_MODAL 케이스 제거됨 - 브랜치 코드 제거 정책
    
    case SessionActionTypes.SET_LOGGED_IN:
      return {
        ...state,
        isLoggedIn: action.payload
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

  // 초기 마운트 시 sessionManager에서 사용자 정보 복원
  useEffect(() => {
    console.log('🔄 SessionProvider 마운트: sessionManager에서 사용자 정보 복원');
    const user = sessionManager.getUser();
    const sessionInfo = sessionManager.getSessionInfo();
    const isLoggedIn = sessionManager.isLoggedIn();
    
    if (user && isLoggedIn) {
      console.log('✅ SessionProvider: sessionManager에서 사용자 정보 발견:', user);
      dispatch({ type: SessionActionTypes.SET_USER, payload: user });
      dispatch({ type: SessionActionTypes.SET_LOGGED_IN, payload: true });
      if (sessionInfo) {
        dispatch({ type: SessionActionTypes.SET_SESSION_INFO, payload: sessionInfo });
      }
    } else {
      console.log('❌ SessionProvider: sessionManager에 사용자 정보 없음');
    }
  }, []); // 빈 배열: 마운트 시 한 번만 실행

  // 세션 체크 함수 (useCallback으로 메모이제이션)
  const checkSession = useCallback(async (force = false) => {
    const now = Date.now();
    
    // stateRef를 통해 최신 state 값 참조
    const currentState = stateRef.current;
    
    // 모달이 열려있으면 세션 체크 스킵 (모달 닫힘 방지)
    if (!force && currentState.isModalOpen) {
      console.log('🔄 세션 체크 스킵 (모달 열림)');
      return currentState.isLoggedIn;
    }
    
    // 강제 확인이 아니고, 이미 체크 중이거나 최근에 체크했으면 스킵
    if (!force && (currentState.isLoading || (now - currentState.lastCheckTime < SESSION_CHECK_INTERVAL))) {
      console.log('🔄 세션 체크 스킵 (중복 방지)');
      return currentState.isLoggedIn;
    }

    dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
    dispatch({ type: SessionActionTypes.SET_LAST_CHECK_TIME, payload: now });

    try {
      const isLoggedIn = await sessionManager.checkSession(force);
      const user = sessionManager.getUser();
      const sessionInfo = sessionManager.getSessionInfo();

      if (isLoggedIn && user) {
        // 기존 사용자 정보가 있으면 role 정보 보존
        const currentUser = currentState.user;
        if (currentUser && currentUser.role && !user.role) {
          console.log('🔄 기존 사용자 role 정보 보존:', currentUser.role);
          user.role = currentUser.role;
        }
        
        console.log('🔄 SessionContext: checkSession에서 SET_USER 호출', user);
        dispatch({ type: SessionActionTypes.SET_USER, payload: user });
        if (sessionInfo) {
          console.log('🔄 SessionContext: checkSession에서 SET_SESSION_INFO 호출', sessionInfo);
          dispatch({ type: SessionActionTypes.SET_SESSION_INFO, payload: sessionInfo });
        }
        
        // 지점 매핑 로직 제거됨 - 브랜치 코드 제거 정책
        
        console.log('✅ 중앙 세션 확인 완료:', user);
      } else {
        // 세션 확인 실패 시 기존 사용자 정보가 있으면 보존
        if (state.user && state.user.role) {
          console.log('🔄 세션 확인 실패했지만 기존 사용자 정보 보존:', state.user.role);
          // 기존 사용자 정보 유지, 세션만 클리어하지 않음
          return true; // 로그인 상태 유지
        } else {
          dispatch({ type: SessionActionTypes.CLEAR_SESSION });
          // CONSTANTS.HTTP_STATUS.UNAUTHORIZED 오류는 정상적인 상황이므로 콘솔에 로그하지 않음
        }
      }

      return isLoggedIn;
    } catch (error) {
      // CONSTANTS.HTTP_STATUS.UNAUTHORIZED 오류는 정상적인 상황이므로 콘솔에 오류로 표시하지 않음
      if (error.message && !error.message.includes('CONSTANTS.HTTP_STATUS.UNAUTHORIZED')) {
        console.error('❌ 중앙 세션 확인 실패:', error);
      }
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
    }
  }, []); // 의존성 배열을 빈 배열로 설정 (stateRef 사용으로 무한루프 방지)

  // 로그인 함수 (API 호출 포함)
  const login = async (loginData) => {
    try {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });
      
      console.log('🔐 중앙 세션 로그인 시작:', loginData);
      
      // 기존 세션이 있으면 먼저 정리 (다른 계정으로 로그인 시 충돌 방지)
      // 단, 같은 디바이스/브라우저에서만 정리 (다른 디바이스는 그대로 유지)
      if (state.user || sessionManager.isLoggedIn()) {
        console.log('🧹 기존 세션 정리 시작...');
        const currentUser = state.user || sessionManager.getUser();
        console.log('현재 로그인된 사용자:', currentUser?.email || currentUser?.id);
        
        // 세션 상태만 정리 (백엔드 로그아웃 API는 호출하지 않음)
        // 주의: 현재 디바이스의 세션만 정리 (백엔드에서 다른 디바이스 세션은 그대로 유지됨)
        dispatch({ type: SessionActionTypes.CLEAR_SESSION });
        
        // sessionManager 초기화 (현재 디바이스의 세션 정보만)
        await sessionManager.logout();
        
        // localStorage 정리 (현재 디바이스만)
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('sessionInfo');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
        
        console.log('✅ 기존 세션 정리 완료 (현재 디바이스)');
      }
      
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
        
        // 잠시 후 서버 세션 확인 (쿠키 설정 시간 확보) - 실패해도 사용자 정보 유지
        setTimeout(async () => {
          try {
            console.log('🔄 로그인 후 세션 확인 시작...');
            const sessionCheckResult = await checkSession(true);
            if (sessionCheckResult) {
              console.log('✅ 로그인 후 세션 확인 완료');
            } else {
              console.log('⚠️ 로그인 후 세션 확인 실패했지만 사용자 정보 유지');
            }
          } catch (error) {
            console.error('❌ 로그인 후 세션 확인 실패:', error);
            console.log('⚠️ 세션 확인 실패했지만 사용자 정보 유지');
          }
        }, CONSTANTS.FORM_CONSTANTS.MAX_COMMENT_LENGTH); // CONSTANTS.NOTIFICATION_CONSTANTS.PRIORITY_LOW초 → 500ms로 단축
        
        console.log('✅ 중앙 세션 로그인 완료:', response.user);
        return { success: true, user: response.user };
      } else if (response && response.requiresConfirmation) {
        // 중복 로그인 확인 요청
        console.log('🔔 중복 로그인 확인 요청:', response.message);
        dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
        dispatch({ 
          type: SessionActionTypes.SET_DUPLICATE_LOGIN_MODAL, 
          payload: {
            isOpen: true,
            message: response.message,
            loginData: loginData
          }
        });
        return { success: false, requiresConfirmation: true, message: response.message };
      } else {
        console.log('❌ 로그인 실패:', response);
        dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
        return { success: false, message: response?.message || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('❌ 중앙 세션 로그인 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
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
      }, CONSTANTS.FORM_CONSTANTS.MAX_COMMENT_LENGTH); // CONSTANTS.NOTIFICATION_CONSTANTS.PRIORITY_LOW초 → 500ms로 단축
      
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
      
      // 로그인 페이지로 즉시 리다이렉트 (sessionManager에서 처리하므로 여기서는 스킵)
      // sessionManager.logout()에서 이미 리다이렉트 처리함
      return true;
    } catch (error) {
      console.error('❌ 중앙 세션 로그아웃 실패:', error);
      dispatch({ type: SessionActionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  };

  // 주기적 세션 체크
  // 무한루프 방지를 위해 임시 비활성화
  // useEffect(() => {
  //   // 현재 페이지가 로그인 페이지인지 확인
  //   const currentPath = window.location.pathname;
  //   const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
  //   
  //   // 로그인 페이지가 아니면 초기 세션 체크
  //   if (!isLoginPage) {
  //     checkSession();
  //   }

  //   // 주기적 세션 체크 설정 (로그인 페이지가 아닐 때만)
  //   const interval = setInterval(() => {
  //     const currentPath = window.location.pathname;
  //     const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
  //     
  //     if (!state.isLoading && !isLoginPage) {
  //       checkSession();
  //     }
  //   }, SESSION_CHECK_INTERVAL);

  //   return () => clearInterval(interval);
  // }, []); // 의존성 배열을 빈 배열로 설정 (checkSession이 안정적이므로)

  // 자동 리다이렉트 로직 제거 (무한루프 방지)
  // OAuth2 콜백에서만 리다이렉트 처리

  // sessionManager 변경사항 리스너 (무한루프 방지를 위해 임시 비활성화)
  // useEffect(() => {
  //   const handleSessionChange = () => {
  //     const user = sessionManager.getUser();
  //     const sessionInfo = sessionManager.getSessionInfo();
  //     
  //     if (user) {
  //       dispatch({ type: SessionActionTypes.SET_USER, payload: user });
  //       if (sessionInfo) {
  //         dispatch({ type: SessionActionTypes.SET_SESSION_INFO, payload: sessionInfo });
  //       }
  //     } else {
  //       dispatch({ type: SessionActionTypes.CLEAR_SESSION });
  //     }
  //   };

  //   // sessionManager 리스너 등록
  //   sessionManager.addListener(handleSessionChange);

  //   return () => {
  //     sessionManager.removeListener(handleSessionChange);
  //   };
  // }, []);

  // 모달 상태 관리 함수들 (useCallback으로 메모이제이션)
  const setModalOpen = useCallback((isOpen) => {
    dispatch({ type: SessionActionTypes.SET_MODAL_OPEN, payload: isOpen });
  }, []);

  // 중복 로그인 모달 상태 관리 함수
  const setDuplicateLoginModal = useCallback((modalState) => {
    dispatch({ type: SessionActionTypes.SET_DUPLICATE_LOGIN_MODAL, payload: modalState });
  }, []);

  // 지점 매핑 모달 관련 함수 제거됨 - 브랜치 코드 제거 정책

  const value = {
    // 상태
    user: state.user,
    sessionInfo: state.sessionInfo,
    isLoading: state.isLoading,
    isLoggedIn: state.isLoggedIn,
    error: state.error,
    isModalOpen: state.isModalOpen,
    duplicateLoginModal: state.duplicateLoginModal,
    // branchMappingModal 제거됨 - 브랜치 코드 제거 정책
    
    // 액션
    checkSession,
    login,
    testLogin,
    logout,
    setModalOpen,
    setDuplicateLoginModal,
    // setBranchMappingModal, handleBranchMappingSuccess 제거됨 - 브랜치 코드 제거 정책
    
    // 유틸리티
    hasRole: (role) => state.user?.role === role,
    hasAnyRole: (roles) => roles.includes(state.user?.role),
    isAdmin: () => RoleUtils.isAdmin(state.user),
    isSuperAdmin: () => state.user?.role === USER_ROLES.BRANCH_SUPER_ADMIN || 
                        state.user?.role === USER_ROLES.SUPER_HQ_ADMIN,
    isConsultant: () => RoleUtils.isConsultant(state.user),
    isClient: () => RoleUtils.isClient(state.user),
    
    // 동적 권한 체크 (백엔드 API 호출)
    hasPermission: async (permission) => {
      try {
        const { apiPost } = await import('../utils/ajax');
        const result = await apiPost('/api/v1/permissions/check-permission', { permission });
        return result?.success && result?.data?.hasPermission === true;
      } catch (error) {
        console.error('권한 체크 오류:', error);
        return false;
      }
    }
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
