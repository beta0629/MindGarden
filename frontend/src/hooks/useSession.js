import { useState, useEffect, useRef } from 'react';
import { sessionManager } from '../utils/sessionManager';
import { PERIODIC_SESSION_CHECK_INTERVAL } from '../constants/session';

export const useSession = () => {
    const [sessionState, setSessionState] = useState({
        user: sessionManager.getUser(),
        sessionInfo: sessionManager.getSessionInfo(),
        isLoading: sessionManager.isLoading  // 로딩 상태 없이 시작
    });
    
    const initializedRef = useRef(false);
    
    useEffect(() => {
        // 중복 초기화 방지
        if (initializedRef.current) return;
        initializedRef.current = true;
        
        console.log('🚀 useSession 초기화 시작...');
        
        const handleSessionChange = (newState) => {
            console.log('🔄 세션 상태 변경:', newState);
            setSessionState(prevState => {
                // 상태가 실제로 변경된 경우만 업데이트
                if (prevState.user?.id !== newState.user?.id || 
                    prevState.sessionInfo?.sessionId !== newState.sessionInfo?.sessionId ||
                    prevState.isLoading !== newState.isLoading) {
                    return newState;
                }
                return prevState;
            });
        };
        
        // 초기 세션 확인 (로딩 없이 즉시 확인)
        const initializeSession = async () => {
            try {
                console.log('🔍 초기 세션 체크 (로딩 없음)...');
                
                // 로딩 상태 설정하지 않고 즉시 확인
                await sessionManager.checkSession();
                console.log('✅ 초기 세션 체크 완료');
            } catch (error) {
                console.error('❌ 초기 세션 체크 실패:', error);
                // 오류가 발생해도 로딩 상태는 설정하지 않음
            }
        };
        
        // 리스너 등록
        sessionManager.addListener(handleSessionChange);
        
        // 초기 세션 확인
        initializeSession();
        
        // 정기적인 세션 확인 (무한 로딩 문제로 임시 비활성화)
        // const interval = setInterval(() => {
        //     console.log('⏰ 정기 세션 체크...');
        //     sessionManager.checkSession();
        // }, PERIODIC_SESSION_CHECK_INTERVAL);
        
        return () => {
            console.log('🧹 useSession 정리...');
            sessionManager.removeListener(handleSessionChange);
            // clearInterval(interval);
            initializedRef.current = false;
        };
    }, []); // 빈 의존성 배열로 한 번만 실행
    
    return {
        ...sessionState,
        isLoading: sessionState.isLoading,
        isLoggedIn: sessionState.user !== null && sessionManager.isLoggedIn(),
        checkSession: () => sessionManager.checkSession(),
        logout: () => sessionManager.logout()
    };
};