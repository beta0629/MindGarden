import { useState, useEffect } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useSession = () => {
    const [sessionState, setSessionState] = useState({
        user: null,
        sessionInfo: null,
        isLoading: true
    });
    
    useEffect(() => {
        const handleSessionChange = (newState) => {
            console.log('🔄 세션 상태 변경:', newState);
            setSessionState(newState);
        };
        
        // 초기 세션 확인
        const initializeSession = async () => {
            console.log('🚀 세션 초기화 시작...');
            try {
                await sessionManager.checkSession();
                console.log('✅ 세션 초기화 완료');
            } catch (error) {
                console.error('❌ 세션 초기화 실패:', error);
            }
        };
        
        initializeSession();
        
        // 리스너 등록
        sessionManager.addListener(handleSessionChange);
        
        // 정기적인 세션 확인 (5분마다)
        const interval = setInterval(() => {
            sessionManager.checkSession();
        }, 5 * 60 * 1000);
        
        return () => {
            sessionManager.removeListener(handleSessionChange);
            clearInterval(interval);
        };
    }, []);
    
    return {
        ...sessionState,
        checkSession: () => sessionManager.checkSession(),
        logout: () => sessionManager.logout()
    };
};
