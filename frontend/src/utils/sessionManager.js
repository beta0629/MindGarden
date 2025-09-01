class SessionManager {
    constructor() {
        this.user = null;
        this.sessionInfo = null;
        this.isLoading = false;
        this.listeners = [];
    }
    
    // 세션 상태 확인
    async checkSession() {
        this.isLoading = true;
        this.notifyListeners(); // 로딩 시작 알림
        
        try {
            console.log('🔍 세션 확인 시작...');
            
            const [userResponse, sessionResponse] = await Promise.all([
                fetch('http://localhost:8080/api/auth/current-user', { credentials: 'include' }),
                fetch('http://localhost:8080/api/auth/session-info', { credentials: 'include' })
            ]);
            
            if (userResponse.ok && sessionResponse.ok) {
                this.user = await userResponse.json();
                this.sessionInfo = await sessionResponse.json();
                console.log('✅ 세션 정보 로드 완료:', { user: this.user, sessionInfo: this.sessionInfo });
            } else {
                // 401 오류는 정상적인 상황 (로그인되지 않은 상태)
                if (userResponse.status === 401 || sessionResponse.status === 401) {
                    console.log('ℹ️ 로그인되지 않은 상태 - 정상적인 상황');
                } else {
                    console.log('❌ 세션 정보 로드 실패:', userResponse.status, sessionResponse.status);
                }
                this.user = null;
                this.sessionInfo = null;
            }
            
            this.notifyListeners();
            return this.user !== null;
            
        } catch (error) {
            // 네트워크 오류나 기타 예외는 로그에 남기되, 401은 정상으로 처리
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.log('ℹ️ 네트워크 연결 실패 - 서버가 실행되지 않았을 수 있습니다');
            } else {
                console.error('❌ 세션 확인 중 예외 발생:', error);
            }
            this.user = null;
            this.sessionInfo = null;
            this.notifyListeners();
            return false;
        } finally {
            this.isLoading = false;
            this.notifyListeners(); // 로딩 완료 알림
        }
    }
    
    // 로그아웃
    async logout() {
        try {
            await fetch('http://localhost:8080/api/auth/logout', { 
                method: 'POST',
                credentials: 'include' 
            });
        } catch (error) {
            console.error('로그아웃 실패:', error);
        } finally {
            this.user = null;
            this.sessionInfo = null;
            this.notifyListeners();
        }
    }
    
    // 상태 변경 리스너
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                user: this.user,
                sessionInfo: this.sessionInfo,
                isLoading: this.isLoading
            });
        });
    }
    
    // Getter 메서드들
    getUser() { return this.user; }
    getSessionInfo() { return this.sessionInfo; }
    isLoading() { return this.isLoading; }
    isLoggedIn() { return this.user !== null; }
}

// 싱글톤 인스턴스
export const sessionManager = new SessionManager();
