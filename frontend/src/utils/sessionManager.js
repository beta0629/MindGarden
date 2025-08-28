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
                this.user = null;
                this.sessionInfo = null;
                console.log('❌ 세션 정보 로드 실패');
            }
            
            this.notifyListeners();
            return this.user !== null;
            
        } catch (error) {
            console.error('❌ 세션 확인 실패:', error);
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
