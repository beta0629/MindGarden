import { API_BASE_URL } from '../constants/api';
import { 
  SESSION_CHECK_INTERVAL, 
  LOGIN_SESSION_CHECK_DELAY,
  PERIODIC_SESSION_CHECK_INTERVAL 
} from '../constants/session';

class SessionManager {
    constructor() {
        this.user = null;
        this.sessionInfo = null;
        this.isLoading = false;
        this.listeners = [];
        this.lastCheckTime = 0;
        this.checkInProgress = false;
        this.minCheckInterval = SESSION_CHECK_INTERVAL;
    }
    
    // 세션 상태 확인 (강제 확인 옵션 추가)
    async checkSession(force = false) {
        const now = Date.now();
        
        // 강제 확인이 아니고, 이미 체크 중이거나 최근에 체크했으면 스킵
        if (!force && (this.checkInProgress || (now - this.lastCheckTime < this.minCheckInterval))) {
            console.log('🔄 세션 체크 스킵 (중복 방지)');
            return this.user !== null;
        }
        
        this.checkInProgress = true;
        this.isLoading = true;
        this.notifyListeners(); // 로딩 시작 알림
        
        try {
            console.log('🔍 세션 확인 시작...');
            
            // 먼저 current-user로 시도 (더 안정적)
            console.log('🔍 세션 체크 요청:', `${API_BASE_URL}/api/auth/current-user`);
            const userResponse = await fetch(`${API_BASE_URL}/api/auth/current-user`, { 
                credentials: 'include',
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (userResponse.ok) {
                const newUser = await userResponse.json();
                
                // 기존 사용자 정보가 있으면 role 정보 보존
                if (this.user && this.user.role && !newUser.role) {
                    console.log('🔄 sessionManager에서 기존 role 정보 보존:', this.user.role);
                    newUser.role = this.user.role;
                }
                
                this.user = newUser;
                console.log('✅ 사용자 정보 로드 완료:', this.user);
                
                // 세션 정보는 선택적으로 가져오기
                try {
                    console.log('🔍 세션 정보 요청:', `${API_BASE_URL}/api/auth/session-info`);
                    const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/session-info`, { 
                        credentials: 'include',
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    if (sessionResponse.ok) {
                        this.sessionInfo = await sessionResponse.json();
                        console.log('✅ 세션 정보도 로드 완료:', this.sessionInfo);
                    }
                } catch (sessionError) {
                    console.warn('⚠️ 세션 정보 로드 실패 (무시):', sessionError);
                }
            } else if (userResponse.status === 401) {
                console.log('ℹ️ 로그인되지 않은 상태 - 정상적인 상황');
                // 기존 사용자 정보가 있으면 보존 (로그인 직후 세션 동기화 시간 확보)
                if (!this.user || !this.user.role) {
                    this.user = null;
                    this.sessionInfo = null;
                } else {
                    console.log('🔄 401 오류지만 기존 사용자 정보 보존:', this.user.role);
                }
            } else {
                console.log('❌ 사용자 정보 확인 실패:', userResponse.status);
                // 기존 사용자 정보가 있으면 보존
                if (!this.user || !this.user.role) {
                    this.user = null;
                    this.sessionInfo = null;
                } else {
                    console.log('🔄 서버 오류지만 기존 사용자 정보 보존:', this.user.role);
                }
            }
            
            this.lastCheckTime = now;
            this.notifyListeners();
            return this.user !== null;
            
        } catch (error) {
            // 네트워크 오류나 기타 예외는 로그에 남기되, 401은 정상으로 처리
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.log('ℹ️ 네트워크 연결 실패 - 서버가 실행되지 않았을 수 있습니다');
            } else {
                console.error('❌ 세션 확인 중 예외 발생:', error);
            }
            
            // 기존 사용자 정보가 있으면 보존
            if (!this.user || !this.user.role) {
                this.user = null;
                this.sessionInfo = null;
            } else {
                console.log('🔄 예외 발생했지만 기존 사용자 정보 보존:', this.user.role);
            }
            
            this.notifyListeners();
            return this.user !== null;
        } finally {
            this.isLoading = false;
            this.checkInProgress = false;
            this.notifyListeners(); // 로딩 완료 알림
        }
    }
    
    // 로그아웃
    async logout() {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, { 
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
    
    // 세션 강제 초기화 (서버 + 클라이언트)
    async forceClearSession() {
        try {
            console.log('🧹 세션 강제 초기화 시작...');
            
            // 서버 세션 초기화
            await fetch(`${API_BASE_URL}/api/auth/clear-session`, { 
                method: 'POST',
                credentials: 'include' 
            });
            
            // 클라이언트 저장소 초기화
            localStorage.clear();
            sessionStorage.clear();
            
            // 메모리 상태 초기화
            this.user = null;
            this.sessionInfo = null;
            this.lastCheckTime = 0;
            
            this.notifyListeners();
            console.log('✅ 세션 강제 초기화 완료');
            
        } catch (error) {
            console.error('세션 강제 초기화 실패:', error);
            // 서버 요청이 실패해도 클라이언트는 초기화
            localStorage.clear();
            sessionStorage.clear();
            this.user = null;
            this.sessionInfo = null;
            this.lastCheckTime = 0;
            this.notifyListeners();
        }
    }
    
    // localStorage 정리 (개발자 도구용)
    clearLocalStorage() {
        console.log('🧹 localStorage 정리 중...');
        localStorage.clear();
        sessionStorage.clear();
        this.user = null;
        this.sessionInfo = null;
        this.lastCheckTime = 0;
        this.notifyListeners();
        console.log('✅ localStorage 정리 완료');
    }
    
    // 상태 변경 리스너
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    notifyListeners() {
        const currentState = {
            user: this.user,
            sessionInfo: this.sessionInfo,
            isLoading: this.isLoading
        };
        
        console.log('📢 세션 상태 알림:', currentState);
        this.listeners.forEach(callback => {
            callback(currentState);
        });
    }
    
    // 사용자 정보 설정 (로그인 시 사용)
    setUser(user, tokens = null) {
        this.user = user;
        this.sessionInfo = null; // 서버에서 가져올 예정
        
        // 토큰이 있으면 localStorage에 저장
        if (tokens) {
            localStorage.setItem('accessToken', tokens.accessToken);
            if (tokens.refreshToken) {
                localStorage.setItem('refreshToken', tokens.refreshToken);
            }
        }
        
        this.notifyListeners();
        console.log('✅ sessionManager에 사용자 정보 설정:', user);
    }
    
    // Getter 메서드들
    getUser() { 
        // sessionManager의 user만 반환 (서버 응답 우선)
        // localStorage는 백업으로만 사용하지 않음
        return this.user;
    }
    
    getSessionInfo() { return this.sessionInfo; }
    isLoading() { return this.isLoading; }
    
    isLoggedIn() { 
        // sessionManager의 user만 확인 (서버 응답 우선)
        return this.user !== null;
    }
}

// 싱글톤 인스턴스
export const sessionManager = new SessionManager();
