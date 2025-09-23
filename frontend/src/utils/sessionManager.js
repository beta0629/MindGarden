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
        this.isProfileEditing = false; // 프로필 수정 중 플래그
        this.isFormSubmitting = false; // 폼 제출 중 플래그
        this.formSubmitCount = 0; // 폼 제출 카운터
        
        // 전역 폼 제출 감지 이벤트 리스너 등록
        this.setupGlobalFormListeners();
    }
    
    // 전역 폼 제출 감지 설정
    setupGlobalFormListeners() {
        if (typeof window !== 'undefined') {
            // 폼 제출 시작 감지
            document.addEventListener('submit', (e) => {
                // 폼이 실제로 제출되는 경우에만 감지
                if (e.target.tagName === 'FORM') {
                    this.startFormSubmit();
                }
            });
            
            // fetch 요청 감지 (AJAX 폼 제출)
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                // POST, PUT, DELETE 요청인 경우 폼 제출로 간주
                const method = args[1]?.method || 'GET';
                if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                    this.startFormSubmit();
                }
                
                try {
                    const result = await originalFetch(...args);
                    return result;
                } finally {
                    // 요청 완료 후 폼 제출 종료
                    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                        this.endFormSubmit();
                    }
                }
            };
        }
    }
    
    // 세션 상태 확인 (강제 확인 옵션 추가)
    async checkSession(force = false) {
        const now = Date.now();
        
        // 프로필 수정 중이면 세션 체크 스킵
        if (this.isProfileEditing && !force) {
            console.log('🔄 세션 체크 스킵 (프로필 수정 중)');
            return this.user !== null;
        }
        
        // 강제 확인이 아니고, 이미 체크 중이거나 최근에 체크했으면 스킵
        // 페이지 이동 시에는 더 긴 간격 적용
        const minInterval = this.isPageNavigation() ? this.minCheckInterval * 3 : this.minCheckInterval;
        if (!force && (this.checkInProgress || (now - this.lastCheckTime < minInterval))) {
            console.log('🔄 세션 체크 스킵 (중복 방지):', now - this.lastCheckTime, 'ms');
            return this.user !== null;
        }
        
        // 폼 제출 중이면 세션 체크 스킵 (자동 감지)
        if (this.isFormSubmitting && !force) {
            console.log('🔄 세션 체크 스킵 (폼 제출 중)');
            return this.user !== null;
        }
        
        this.checkInProgress = true;
        this.isLoading = true;
        this.notifyListeners(); // 로딩 시작 알림
        
        try {
            console.log('🔍 세션 확인 시작...');
            
            // 먼저 current-user로 시도 (더 안정적)
            let userResponse;
            try {
                userResponse = await fetch(`${API_BASE_URL}/api/auth/current-user`, { 
                    credentials: 'include',
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
            } catch (fetchError) {
                // 네트워크 오류나 401 오류는 정상적인 상황이므로 조용히 처리
                console.log('🔍 세션 확인 실패 (정상):', fetchError.message);
                this.user = null;
                this.sessionInfo = null;
                this.lastCheckTime = now;
                this.notifyListeners();
                return false;
            }
            
            // 401 오류 시 로그인 페이지로 리다이렉트 (로그인 페이지가 아닐 때만)
            if (userResponse.status === 401) {
                console.log('🔍 세션 확인 실패: 401 Unauthorized');
                this.user = null;
                this.sessionInfo = null;
                this.lastCheckTime = now;
                this.notifyListeners();
                
                // 현재 페이지가 로그인 페이지가 아닐 때만 리다이렉트
                const currentPath = window.location.pathname;
                const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
                
                if (!isLoginPage) {
                    console.log('🔍 로그인 페이지로 리다이렉트');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                } else {
                    console.log('🔍 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
                }
                return false;
            }
            
            if (userResponse.ok) {
                const newUser = await userResponse.json();
                
                // 기존 사용자 정보가 있으면 role 정보 보존
                if (this.user && this.user.role && !newUser.role) {
                    console.log('🔄 sessionManager에서 기존 role 정보 보존:', this.user.role);
                    newUser.role = this.user.role;
                }
                
                this.user = newUser;
                console.log('✅ 사용자 정보 로드 완료:', this.user);
                
                // 세션 정보는 선택적으로 가져오기 (페이지 이동 시에는 스킵)
                if (!this.isPageNavigation()) {
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
                } else {
                    console.log('🔄 세션 정보 요청 스킵 (페이지 이동 중)');
                }
            } else {
                // 401이 아닌 다른 오류만 로그에 표시
                if (userResponse.status !== 401) {
                    console.log('❌ 사용자 정보 확인 실패:', userResponse.status);
                }
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
            // 네트워크 오류나 기타 예외 처리
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.log('ℹ️ 네트워크 연결 실패 - 서버가 실행되지 않았을 수 있습니다');
                
                // 네트워크 오류 시에도 세션 체크를 한 번 더 시도
                try {
                    const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
                        credentials: 'include',
                        method: 'GET'
                    });
                    
                    if (!sessionResponse.ok) {
                        console.log('🔐 네트워크 오류 시 세션 없음');
                        this.user = null;
                        this.sessionInfo = null;
                        
                        // 현재 페이지가 로그인 페이지가 아닐 때만 리다이렉트
                        const currentPath = window.location.pathname;
                        const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
                        
                        if (!isLoginPage) {
                            console.log('🔐 네트워크 오류 시 로그인 페이지로 리다이렉트');
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            window.location.href = '/login';
                        } else {
                            console.log('🔐 네트워크 오류 - 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
                        }
                        return false;
                    }
                } catch (sessionError) {
                    console.log('🔐 네트워크 오류 시 세션 체크 실패');
                    this.user = null;
                    this.sessionInfo = null;
                    
                    // 현재 페이지가 로그인 페이지가 아닐 때만 리다이렉트
                    const currentPath = window.location.pathname;
                    const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
                    
                    if (!isLoginPage) {
                        console.log('🔐 네트워크 오류 시 로그인 페이지로 리다이렉트');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                    } else {
                        console.log('🔐 네트워크 오류 - 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
                    }
                    return false;
                }
            } else if (error.message && error.message.includes('401')) {
                // 401 오류는 정상적인 상황이므로 콘솔에 오류로 표시하지 않음
                // 조용히 처리
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
            console.log('🚪 로그아웃 시작...');
            
            // CSRF 토큰 가져오기
            const csrfToken = this.getCsrfToken();
            console.log('🔑 CSRF 토큰:', csrfToken ? '발견됨' : '없음');
            
            // 헤더 구성
            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            // CSRF 토큰이 있으면 추가
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }
            
            // 서버에 로그아웃 요청
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { 
                method: 'POST',
                credentials: 'include',
                headers: headers
            });
            
            if (response.ok) {
                console.log('✅ 서버 로그아웃 완료');
            } else {
                console.warn('⚠️ 서버 로그아웃 응답 오류:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ 서버 로그아웃 실패:', error);
            // 서버 로그아웃 실패해도 클라이언트 로그아웃은 진행
        } finally {
            // 클라이언트 상태 강제 초기화
            this.user = null;
            this.sessionInfo = null;
            this.lastCheckTime = 0;
            this.checkInProgress = false;
            
            // 로컬 저장소 정리
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('sessionInfo');
            sessionStorage.clear();
            
            // 쿠키 정리 (가능한 범위에서)
            document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = '_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // 리스너들에게 알림
            this.notifyListeners();
            
            console.log('✅ 클라이언트 로그아웃 완료');
        }
    }
    
    // CSRF 토큰 가져오기
    getCsrfToken() {
        // 쿠키에서 CSRF 토큰 찾기 (여러 가능한 이름 확인)
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN' || name === '_csrf' || name === 'csrfToken') {
                return decodeURIComponent(value);
            }
        }
        
        // 쿠키에서 찾지 못한 경우 메타 태그에서 찾기
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        if (csrfMeta) {
            return csrfMeta.getAttribute('content');
        }
        
        // 모두 찾지 못한 경우 빈 문자열 반환
        console.warn('⚠️ CSRF 토큰을 찾을 수 없습니다. 쿠키:', document.cookie);
        return '';
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
    
    // 프로필 수정 시작 (세션 체크 일시 중지)
    startProfileEditing() {
        this.isProfileEditing = true;
        console.log('📝 프로필 수정 시작 - 세션 체크 일시 중지');
    }
    
    // 프로필 수정 종료 (세션 체크 재개)
    endProfileEditing() {
        this.isProfileEditing = false;
        console.log('✅ 프로필 수정 종료 - 세션 체크 재개');
        // 프로필 수정 완료 후 즉시 세션 체크
        this.checkSession(true);
    }
    
    // 폼 제출 시작 (자동 감지)
    startFormSubmit() {
        this.formSubmitCount++;
        this.isFormSubmitting = true;
        console.log(`📝 폼 제출 시작 (${this.formSubmitCount}번째) - 세션 체크 일시 중지`);
    }
    
    // 폼 제출 종료 (자동 감지)
    endFormSubmit() {
        this.formSubmitCount = Math.max(0, this.formSubmitCount - 1);
        if (this.formSubmitCount === 0) {
            this.isFormSubmitting = false;
            console.log('✅ 모든 폼 제출 완료 - 세션 체크 재개');
            // 폼 제출 완료 후 즉시 세션 체크
            this.checkSession(true);
        } else {
            console.log(`⏳ 폼 제출 진행 중 (${this.formSubmitCount}개 남음)`);
        }
    }
    
    // 페이지 이동 중인지 확인
    isPageNavigation() {
        return this.isFormSubmitting || this.isProfileEditing;
    }
}

// 싱글톤 인스턴스
export const sessionManager = new SessionManager();
