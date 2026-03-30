import { API_BASE_URL } from '../constants/api';
import {
  SESSION_CHECK_INTERVAL,
  SESSION_CHECK_TIMEOUT,
  SESSION_CHECK_COOLDOWN_MS
} from '../constants/session';
import { getDefaultApiHeaders } from './apiHeaders';

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

    // localStorage에서 사용자 정보 복원
    this.restoreUserFromStorage();

    // 전역 폼 제출 감지 이벤트 리스너 등록
    this.setupGlobalFormListeners();
  }

  // localStorage에서 사용자 정보 복원
  restoreUserFromStorage() {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
        console.log('✅ sessionManager 사용자 정보 복원:', this.user);
      }
    } catch (error) {
      console.error('❌ 사용자 정보 복원 실패:', error);
      this.user = null;
    }
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
    // 3초 이내 최근 체크: 무조건 스킵 (무한루프 근본 방지)
    if (!force && this.lastCheckTime && (now - this.lastCheckTime) < SESSION_CHECK_COOLDOWN_MS) {
      return this.user !== null;
    }
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
        // getDefaultApiHeaders를 사용하여 tenantId 헤더 자동 포함
        const headers = getDefaultApiHeaders();

        userResponse = await fetch(`${API_BASE_URL}/api/v1/auth/current-user`, {
          credentials: 'include',
          method: 'GET',
          mode: 'cors',
          headers
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

        // 환경변수로 리다이렉트 제어 (개발 시 필요하면 .env에서 false 설정)
        const ENABLE_AUTH_REDIRECT = process.env.REACT_APP_ENABLE_AUTH_REDIRECT !== 'false';
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalEnv && !ENABLE_AUTH_REDIRECT) {
          console.log('🔍 로컬 환경 - 401 리다이렉트 스킵 (환경변수 설정)');
          return false;
        }

        // 현재 페이지가 공개 페이지가 아닐 때만 리다이렉트
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/login' ||
          currentPath.startsWith('/login/') ||
          currentPath === '/landing' ||
          currentPath === '/' ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/tablet/register') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password') ||
          currentPath.startsWith('/auth/oauth2/callback');

        // 로그인 직후에는 리다이렉트하지 않음 (세션이 아직 설정되지 않았을 수 있음)
        const isJustAfterLogin = sessionStorage.getItem('justLoggedIn') === 'true';
        if (isJustAfterLogin) {
          console.log('🔍 로그인 직후 - 리다이렉트 스킵 (세션 설정 대기 중)');
          sessionStorage.removeItem('justLoggedIn');
          return false;
        }

        if (!isPublicPage) {
          console.log('🔍 로그인 페이지로 리다이렉트 (서브도메인 유지)');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = `${window.location.origin}/login`;
        } else {
          console.log('🔍 공개 페이지에 있음 - 리다이렉트 스킵');
        }
        return false;
      }

      if (userResponse.ok) {
        const userResponseData = await userResponse.json();
        // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
        const newUser = (userResponseData && typeof userResponseData === 'object' && 'success' in userResponseData && 'data' in userResponseData)
          ? userResponseData.data
          : userResponseData;

        // 기존 사용자 정보가 있으면 role/permissionGroupCodes 보존 (서버 미반환 시)
        if (this.user) {
          if (this.user.role && !newUser.role) {
            newUser.role = this.user.role;
          }
          if (Array.isArray(this.user.permissionGroupCodes) && !Array.isArray(newUser.permissionGroupCodes)) {
            newUser.permissionGroupCodes = this.user.permissionGroupCodes;
          }
        }
        if (!Array.isArray(newUser.permissionGroupCodes)) {
          newUser.permissionGroupCodes = [];
        }

        this.user = newUser;
        console.log('✅ 사용자 정보 로드 완료:', this.user);

        // 세션 정보는 선택적으로 가져오기 (페이지 이동 시에는 스킵)
        if (!this.isPageNavigation()) {
          try {
            console.log('🔍 세션 정보 요청:', `${API_BASE_URL}/api/v1/auth/session-info`);
            const sessionHeaders = getDefaultApiHeaders();
            const sessionResponse = await fetch(`${API_BASE_URL}/api/v1/auth/session-info`, {
              credentials: 'include',
              method: 'GET',
              mode: 'cors',
              headers: sessionHeaders
            });
            if (sessionResponse.ok) {
              const sessionResponseData = await sessionResponse.json();
              // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
              this.sessionInfo = (sessionResponseData && typeof sessionResponseData === 'object' && 'success' in sessionResponseData && 'data' in sessionResponseData)
                ? sessionResponseData.data
                : sessionResponseData;
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
        // 기존 사용자 정보가 있으면 보존 (더 관대하게 처리)
        if (this.user && this.user.role) {
          console.log('🔄 서버 오류지만 기존 사용자 정보 보존:', this.user.role);
          // 사용자 정보는 그대로 유지
        } else {
          this.user = null;
          this.sessionInfo = null;
        }
      }

      this.lastCheckTime = now;
      this.notifyListeners();
      return this.user !== null;

    } catch (error) {
      // 네트워크 오류나 기타 예외 처리
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.log('ℹ️ 네트워크 연결 실패 - 서버가 실행되지 않았을 수 있습니다');

        // 네트워크 오류 시 재시도하지 않고 바로 로그인 페이지로 리다이렉트
        this.user = null;
        this.sessionInfo = null;

        // 환경변수로 리다이렉트 제어
        const ENABLE_AUTH_REDIRECT = process.env.REACT_APP_ENABLE_AUTH_REDIRECT !== 'false';
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalEnv && !ENABLE_AUTH_REDIRECT) {
          console.log('🔍 로컬 환경 - 네트워크 오류 리다이렉트 스킵 (환경변수 설정)');
          return false;
        }

        // 현재 페이지가 공개 페이지가 아닐 때만 리다이렉트
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/login' ||
          currentPath.startsWith('/login/') ||
          currentPath === '/landing' ||
          currentPath === '/' ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password') ||
          currentPath.startsWith('/auth/oauth2/callback');

        if (!isPublicPage) {
          console.log('🔐 네트워크 오류 시 로그인 페이지로 리다이렉트 (재시도 없음, 서브도메인 유지)');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = `${window.location.origin}/login`;
        } else {
          console.log('🔐 네트워크 오류 - 공개 페이지에 있음 - 리다이렉트 스킵');
        }
        return false;
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
        // 기존 사용자 정보가 있으면 로그인 상태 유지
        return true;
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
      console.log('🔓 로그아웃 시작...');

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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
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
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('sessionInfo');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // ⚠️ 표준화/멀티테넌트: 로그아웃 후에도 "현재 접속 서브도메인" 컨텍스트는 유지해야 함
      // (subdomain → tenantId 자동 매핑을 위해 subdomain 관련 값은 보존)
      const preserved = {
        subdomain_tenant_id: sessionStorage.getItem('subdomain_tenant_id'),
        subdomain: sessionStorage.getItem('subdomain')
      };
      sessionStorage.clear();
      if (preserved.subdomain_tenant_id) {
        sessionStorage.setItem('subdomain_tenant_id', preserved.subdomain_tenant_id);
      }
      if (preserved.subdomain) {
        sessionStorage.setItem('subdomain', preserved.subdomain);
      }

      // 쿠키 정리 (가능한 범위에서)
      document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // 리스너들에게 알림
      this.notifyListeners();

      console.log('✅ 클라이언트 로그아웃 완료');

      // 로그인 페이지로 리다이렉트 (서브도메인별로 이동 - 서브도메인 필수)
      console.log('🔍 로그인 페이지로 리다이렉트 (서브도메인별 이동)');

      // 현재 호스트 확인
      const host = window.location.hostname;

      // 로컬 환경 체크
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // 로컬 환경: 현재 origin 유지
        console.log('✅ 로컬 환경 - 현재 origin 유지:', window.location.origin);
        window.location.replace(`${window.location.origin}/login?logout=success`);
      } else {
        // 서브도메인 추출 로직
        const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
        let targetSubdomain = null;

        // 1. 현재 호스트에서 서브도메인 추출 시도
        const hostParts = host.split('.');
        const firstLabel = hostParts[0];
        const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;

        if (hasSubdomain) {
          // 현재 호스트에 서브도메인이 있으면 사용
          targetSubdomain = firstLabel;
          console.log('✅ 현재 호스트에서 서브도메인 추출:', targetSubdomain);
        } else if (preserved.subdomain) {
          // 현재 호스트에 서브도메인이 없지만 보존된 서브도메인 정보가 있으면 사용
          targetSubdomain = preserved.subdomain;
          console.log('✅ 보존된 서브도메인 사용:', targetSubdomain);
        }

        // 서브도메인이 있으면 해당 서브도메인/login으로 이동
        if (targetSubdomain) {
          const subdomainUrl = `https://${targetSubdomain}.dev.core-solution.co.kr/login?logout=success`;
          console.log('✅ 서브도메인으로 이동:', subdomainUrl);
          window.location.replace(subdomainUrl);
        } else {
          // 서브도메인 정보가 전혀 없으면 에러 (dev.core-solution.co.kr/login으로 이동하지 않음)
          console.error('❌ 서브도메인 정보 없음 - 로그인 페이지로 이동 불가');
          // 사용자에게 명확한 에러 메시지 표시를 위해 현재 페이지에 에러 파라미터 추가
          const errorUrl = `${window.location.origin}/login?logout=error&message=${encodeURIComponent('서브도메인 정보가 없습니다. 올바른 서브도메인으로 접속해주세요. 예: mindgarden.dev.core-solution.co.kr')}`;
          window.location.replace(errorUrl);
        }
      }
    }
  }

  // CSRF 토큰 가져오기
  getCsrfToken() {
    // 쿠키에서 CSRF 토큰 찾기 (여러 가능한 이름 확인)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
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
      await fetch(`${API_BASE_URL}/api/v1/auth/clear-session`, {
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

    // 사용자 정보를 localStorage에 저장
    if (user) {
      localStorage.setItem('userInfo', JSON.stringify(user));
    }

    // 토큰이 있으면 localStorage에 저장
    if (tokens) {
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
    }

    this.notifyListeners();
    console.log('✅ sessionManager에 사용자 정보 설정:', user);
    console.log('🔍 tenantId 확인:', user?.tenantId || '없음');
  }

  // Getter 메서드들
  getUser() {
    // sessionManager의 user만 반환 (서버 응답 우선)
    // localStorage는 백업으로만 사용하지 않음
    return this.user;
  }

  getSessionInfo() { return this.sessionInfo; }
  getLastCheckTime() { return this.lastCheckTime; }
  isLoading() { return this.isLoading; }

  isLoggedIn() {
    // sessionManager의 user만 확인 (서버 응답 우선)
    return this.user !== null;
  }

  // 현재 테넌트 역할 정보 반환
  getCurrentTenantRole() {
    if (!this.user) {
      return null;
    }

    // 사용자 정보에서 currentTenantRole 또는 tenantRole 추출
    return this.user.currentTenantRole ||
      this.user.tenantRole ||
      (this.user.currentTenantRoleId ? { tenantRoleId: this.user.currentTenantRoleId } : null);
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
