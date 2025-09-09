import { useState, useEffect, useRef } from 'react';
import { sessionManager } from '../utils/sessionManager';
import { PERIODIC_SESSION_CHECK_INTERVAL } from '../constants/session';

export const useSession = () => {
    const [sessionState, setSessionState] = useState({
        user: null,
        sessionInfo: null,
        isLoading: false  // 초기값을 false로 변경
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
        
        // 초기 세션 확인 (한 번만)
        const initializeSession = async () => {
            try {
                console.log('🔍 초기 세션 체크...');
                
                // 로딩 상태 설정
                setSessionState(prev => ({ ...prev, isLoading: true }));
                
                // 타임아웃 설정 (5초)
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('세션 체크 타임아웃')), 5000)
                );
                
                // 서버에서만 세션 확인 (localStorage 백업 제거)
                await Promise.race([
                    sessionManager.checkSession(),
                    timeoutPromise
                ]);
                console.log('✅ 초기 세션 체크 완료');
            } catch (error) {
                console.error('❌ 초기 세션 체크 실패:', error);
                // 타임아웃이거나 오류가 발생해도 로딩 상태는 해제
            } finally {
                // 로딩 상태 해제
                setSessionState(prev => ({ ...prev, isLoading: false }));
            }
        };
        
        // 리스너 등록
        sessionManager.addListener(handleSessionChange);
        
        // 초기 세션 확인
        initializeSession();
        
        // 정기적인 세션 확인
        const interval = setInterval(() => {
            console.log('⏰ 정기 세션 체크...');
            sessionManager.checkSession();
        }, PERIODIC_SESSION_CHECK_INTERVAL);
        
        return () => {
            console.log('🧹 useSession 정리...');
            sessionManager.removeListener(handleSessionChange);
            clearInterval(interval);
            initializedRef.current = false;
        };
    }, []); // 빈 의존성 배열로 한 번만 실행
    
    return {
        ...sessionState,
        isLoggedIn: sessionState.user !== null && sessionManager.isLoggedIn(),
        checkSession: () => sessionManager.checkSession(),
        logout: () => sessionManager.logout()
    };
};