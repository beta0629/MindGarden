import { useState, useEffect, useRef } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useSession = () => {
    const [sessionState, setSessionState] = useState({
        user: null,
        sessionInfo: null,
        isLoading: true
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
                if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
                    return newState;
                }
                return prevState;
            });
        };
        
        // 초기 세션 확인 (한 번만)
        const initializeSession = async () => {
            try {
                console.log('🔍 초기 세션 체크...');
                await sessionManager.checkSession();
                console.log('✅ 초기 세션 체크 완료');
            } catch (error) {
                console.error('❌ 초기 세션 체크 실패:', error);
            }
        };
        
        // 리스너 등록
        sessionManager.addListener(handleSessionChange);
        
        // 초기 세션 확인
        initializeSession();
        
        // 정기적인 세션 확인 (15분마다로 늘림)
        const interval = setInterval(() => {
            console.log('⏰ 정기 세션 체크...');
            sessionManager.checkSession();
        }, 15 * 60 * 1000);
        
        return () => {
            console.log('🧹 useSession 정리...');
            sessionManager.removeListener(handleSessionChange);
            clearInterval(interval);
            initializedRef.current = false;
        };
    }, []); // 빈 의존성 배열로 한 번만 실행
    
    return {
        ...sessionState,
        checkSession: () => sessionManager.checkSession(),
        logout: () => sessionManager.logout()
    };
};