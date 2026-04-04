/**
 * 통합 로그인 컴포넌트
 * Phase 3: 통합 로그인 시스템 프론트엔드
/**
 *
/**
 * 모든 업종 통합 로그인 페이지
/**
 * - ID/PW 로그인
/**
 * - 소셜 로그인 (Kakao/Naver/Google/Apple)
/**
 * - 테넌트 자동 감지 및 라우팅
/**
 *
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { API_BASE_URL } from '../../constants/api';
import { LOGIN_SESSION_CHECK_DELAY } from '../../constants/session';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import { sessionManager } from '../../utils/sessionManager';
import { googleLogin, kakaoLogin, naverLogin } from '../../utils/socialLogin';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SocialSignupModal from './SocialSignupModal';
import TenantSelection from './TenantSelection';
import PasswordChangeModal from '../mypage/components/PasswordChangeModal';
// @deprecated 레거시 함수는 하위 호환성을 위해 유지하되, 새로운 코드에서는 사용하지 않음
// import { getDashboardPath, redirectToDashboardWithFallback } from '../../utils/session';
import '../../styles/auth/UnifiedLogin.css';
import notificationManager from '../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import {
  shouldRedirectWrongPath,
  WRONG_PATH_MESSAGE,
  WRONG_PATH_REDIRECT_DELAY_MS
} from '../../utils/subdomainUtils';
import {
  LOGIN_CREDENTIALS_MISMATCH_MESSAGE,
  LOGIN_IDENTIFIER_FIELD_HINT,
  LOGIN_IDENTIFIER_LABEL,
  LOGIN_IDENTIFIER_PASSWORD_REQUIRED,
  LOGIN_IDENTIFIER_PLACEHOLDER
} from '../../constants/loginDisplay';

const UnifiedLogin = () => {
  console.log('🚀 UnifiedLogin 컴포넌트 렌더링 시작');
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSession, setDuplicateLoginModal, user } = useSession();

  // URL 파라미터에서 email 가져오기
  const searchParams = new URLSearchParams(location.search);
  const emailFromUrl = searchParams.get('email');

  const [formData, setFormData] = useState({
    email: emailFromUrl || '',
    password: ''
  });

  console.log('📋 초기 formData 상태:', formData);
  const [showPassword, setShowPassword] = useState(false);

  // 컴포넌트 마운트 확인
  useEffect(() => {
    console.log('✅ UnifiedLogin 컴포넌트 마운트됨');
    console.log('📋 마운트 시 formData:', formData);
    console.log('🔧 handleInputChange 함수:', typeof handleInputChange);
  }, []);

  /** 테넌트 도메인인데 서브도메인이 없으면 잘못된 경로: 알림 후 홈으로 리다이렉트 (localhost 제외) */
  useEffect(() => {
    if (!shouldRedirectWrongPath()) return;
    notificationManager.show(WRONG_PATH_MESSAGE, 'warning');
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, WRONG_PATH_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate]);
  const [oauth2Config, setOauth2Config] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialSignupModal, setShowSocialSignupModal] = useState(false);
  const [socialUserInfo, setSocialUserInfo] = useState(null);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [tempPassword, setTempPassword] = useState(''); // 임시 비밀번호 저장 (비밀번호 변경 모달에 전달)
  const sessionCheckedRef = useRef(false); // 세션 체크 완료 여부 (ref 사용으로 리렌더링 방지)

  // 툴팁 상태
  const [tooltip, setTooltip] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  // 툴팁 표시 함수
  const showTooltip = (message, type = 'error') => {
    const text =
      type === 'error' ? toErrorMessage(message) : toDisplayString(message);
    setTooltip({ show: true, message: text, type });
    setTimeout(() => {
      setTooltip({ show: false, message: '', type: 'error' });
    }, 6000);
  };

  // 서브도메인에서 tenant_id 자동 감지 (표준화: 특정 도메인 정규식 하드코딩 금지)
  useEffect(() => {
    const detectTenantFromSubdomain = async () => {
      try {
        // 1. URL 파라미터에서 tenantId 확인 (로컬 테스트용)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTenantId = urlParams.get('tenantId');
        if (urlTenantId) {
          console.log('🔧 URL 파라미터에서 tenantId 감지 (로컬 테스트용): tenantId=', urlTenantId);
          sessionStorage.setItem('subdomain_tenant_id', urlTenantId);
          return;
        }

        // 2. 환경 변수에서 테스트용 tenantId 확인 (로컬 개발용)
        const envTenantId = process.env.REACT_APP_TEST_TENANT_ID;
        if (envTenantId && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.log('🔧 환경 변수에서 tenantId 감지 (로컬 개발용): tenantId=', envTenantId);
          sessionStorage.setItem('subdomain_tenant_id', envTenantId);
          return;
        }

        const host = window.location.host;
        if (!host) return;

        // 3. subdomain 추출: host의 첫 라벨을 사용 (도메인 문자열 하드코딩 금지)
        // 예) coresolution.dev.core-solution.co.kr -> coresolution
        // 예) dev.core-solution.co.kr -> dev (기본 서브도메인으로 간주하여 제외)
        const hostWithoutPort = host.split(':')[0];
        const firstLabel = hostWithoutPort.split('.')[0];
        const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www', 'localhost', '127'];
        const subdomain = firstLabel && !defaultSubdomains.includes(firstLabel) ? firstLabel : null;

        if (subdomain) {
          console.log('🔍 서브도메인 감지: subdomain=', subdomain);

          // 백엔드 API로 tenant_id 조회
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/tenant/by-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
            credentials: 'include',
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            const tenantData = result.success && result.data ? result.data : result;

            if (tenantData.found && tenantData.tenant && tenantData.tenant.tenantId) {
              const tenantId = tenantData.tenant.tenantId;
              console.log('✅ 서브도메인으로 tenant_id 조회 성공: tenantId=', tenantId);

              // sessionStorage에 저장 (SNS 로그인 시 사용)
              sessionStorage.setItem('subdomain_tenant_id', tenantId);
              sessionStorage.setItem('subdomain', subdomain);
            } else {
              console.log('⚠️ 서브도메인으로 테넌트를 찾을 수 없음: subdomain=', subdomain);
            }
          }
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // 로컬 환경에서 서브도메인이 없으면 안내 메시지
          console.log('💡 로컬 환경: 서브도메인 없음. 테스트를 위해 다음 방법을 사용하세요:');
          console.log('   1. URL 파라미터: ?tenantId=tenant-incheon-counseling-001');
          console.log('   2. 환경 변수: REACT_APP_TEST_TENANT_ID=tenant-incheon-counseling-001');
          console.log('   3. /etc/hosts 설정: coresolution.localhost → 127.0.0.1');
        }
      } catch (error) {
        console.error('❌ 서브도메인에서 tenant_id 감지 실패:', error);
      }
    };

    detectTenantFromSubdomain();
  }, []);

  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    getOAuth2Config();
    checkOAuthCallback();

    // 세션 체크는 useSession 훅에서 처리하므로 여기서는 제거 (무한 루프 방지)
    // checkExistingSession은 제거하고 useSession의 세션 체크만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열: 마운트 시 한 번만 실행

  // OAuth 콜백은 location.search 변경 시에만 체크
  useEffect(() => {
    checkOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // useSession에서 사용자 정보가 감지되면, 실제 세션(200) 검증 후에만 리다이렉트
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('logout') === 'success' || q.get('logout') === 'error') {
      return;
    }
    if (!user?.id || isLoading || tooltip.show) return;
    let cancelled = false;
    (async () => {
      const ok = await checkSession(true);
      if (cancelled) return;
      if (!ok) return;
      const validatedUser = sessionManager.getUser();
      if (validatedUser?.id) {
        checkMultiTenantAndRedirect(validatedUser);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, tooltip.show, location.search]);

  // OAuth2 설정 가져오기
  const getOAuth2Config = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/config/oauth2`);
      if (response.ok) {
        const config = await response.json();
        setOauth2Config(config);
      }
    } catch (error) {
      console.error('OAuth2 설정 로드 실패:', error);
    }
  };

  // 로그아웃 상태 확인
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const logoutStatus = searchParams.get('logout');
    const logoutMessage = searchParams.get('message');
    
    if (logoutStatus === 'success') {
      notificationManager.show('로그아웃되었습니다.', 'success');
      
      // 서브도메인 확인 및 안내
      const host = window.location.hostname;
      const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
      const hostParts = host.split('.');
      const firstLabel = hostParts[0];
      const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;
      
      // 서브도메인이 없으면 안내 메시지 추가
      if (!hasSubdomain && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const subdomainMessage = '서브도메인으로 접속해주세요.\n\n예: coresolution.dev.core-solution.co.kr';
        setTimeout(() => {
          showTooltip(subdomainMessage, 'warning');
          notificationManager.show(subdomainMessage, 'warning');
        }, 1000);
      }
      
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
    } else if (logoutStatus === 'error') {
      const errorMsg = logoutMessage ? decodeURIComponent(logoutMessage) : '로그아웃 중 오류가 발생했습니다.';
      showTooltip(errorMsg, 'error');
      notificationManager.show(errorMsg, 'error');
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location.search]);

  // OAuth 콜백 확인
  const checkOAuthCallback = () => {
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');
    const provider = searchParams.get('provider');
    const signupRequired = searchParams.get('signup');
    const error = searchParams.get('error');

    // OAuth 오류 처리 (서브도메인 없음 등)
    if (error) {
      try {
        const decodedError = decodeURIComponent(error);
        console.log('🔤 디코딩된 OAuth 에러 메시지:', decodedError);
        
        // 서브도메인 관련 오류인 경우 명확한 메시지 표시 (로컬 환경에서는 원본 에러 표시)
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalEnv && (decodedError.includes('테넌트 정보가 없습니다') || decodedError.includes('서브도메인'))) {
          const host = window.location.hostname;
          const friendlyMessage = '서브도메인이 필요합니다.\n\n예: coresolution.dev.core-solution.co.kr\n\n현재 도메인: ' + host + '\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.';
          showTooltip(friendlyMessage, 'error');
          notificationManager.show(friendlyMessage, 'error');
        } else {
          // 일반 에러는 원본 메시지 표시
          showTooltip(decodedError, 'error');
          notificationManager.show(decodedError, 'error');
        }
        
        // URL에서 에러 파라미터 제거
        window.history.replaceState({}, document.title, '/login');
        console.log('🧹 URL에서 에러 파라미터 제거됨');
        return;
      } catch (parseError) {
        console.error('OAuth 에러 메시지 파싱 실패:', parseError);
        showTooltip('로그인 중 오류가 발생했습니다.', 'error');
        // URL에서 에러 파라미터 제거
        window.history.replaceState({}, document.title, '/login');
        return;
      }
    }

    if (success === 'true' && provider) {
      // OAuth2Callback 컴포넌트에서 처리하도록 리다이렉트
      navigate(`/auth/oauth2/callback${location.search}`, { replace: true });
      return;
    }

    // 간편 회원가입 필요: /login?signup=required&provider=...&tenantId=...&email=...&name=...&nickname=...
    if (signupRequired === 'required' && provider) {
      const email = searchParams.get('email') || '';
      const name = searchParams.get('name') || '';
      const nickname = searchParams.get('nickname') || '';
      const tenantId = searchParams.get('tenantId') || sessionStorage.getItem('subdomain_tenant_id');

      console.log('📝 간편 회원가입 필요 감지 (signup=required):', { provider, tenantId, email });
      // 사용자 안내 메시지 (표준: notificationManager 사용, alert 금지)
      notificationManager.show(`${provider} 소셜 로그인 성공! 회원가입을 완료해주세요.`, 'success');

      setSocialUserInfo({
        provider,
        providerUserId: searchParams.get('providerUserId') || null,
        email,
        name,
        nickname,
        profileImageUrl: searchParams.get('profileImageUrl') || null,
        tenantId: tenantId || null
      });
      setShowSocialSignupModal(true);
    }
  };

  // 기존 세션 확인 (한 번만 실행, 직접 API 호출로 SessionContext 우회) - 미사용으로 주석 처리
  /*
  const checkExistingSession = async () => {
    // 이미 체크했거나 로딩 중이면 스킵
    if (sessionCheckedRef.current || isLoading || tooltip.show) {
      return;
    }

    // 세션 체크 시작 표시
    sessionCheckedRef.current = true;

    try {
      // SessionContext의 checkSession을 우회하여 직접 API 호출 (무한 루프 방지)
      await new Promise(resolve => setTimeout(resolve, LOGIN_SESSION_CHECK_DELAY));

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/current-user`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        // ApiResponse 래퍼 처리
        const userData = (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData)
          ? responseData.data
          : responseData;

        if (userData && userData.id) {
          // 사용자 정보가 있으면 sessionManager에 설정
          sessionManager.setUser(userData);
          // SessionContext 동기화 (로그인 직후 공통코드 등에서 user 사용 가능하도록)
          await checkSession(true);

          // 멀티 테넌트 사용자 확인
          await checkMultiTenantAndRedirect(userData);
        } else {
          // 사용자 정보가 없어도 체크 완료로 표시 (무한 루프 방지)
          console.log('🔍 세션 확인 완료: 로그인되지 않은 상태');
        }
      } else {
        // 응답이 OK가 아니어도 체크 완료로 표시 (무한 루프 방지)
        console.log('🔍 세션 확인 완료: 응답 상태', response.status);
      }
    } catch (error) {
      console.error('세션 확인 오류:', error);
      // 오류 발생 시에도 체크 완료로 표시 (무한 루프 방지)
      sessionCheckedRef.current = true;
    }
  };
  */

  // 멀티 테넌트 사용자 확인 및 리다이렉트
  const checkMultiTenantAndRedirect = async (user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/tenant/check-multi`, {
        credentials: 'include'
      });

      if (response.status === 401 || !response.ok) {
        await checkSession(true);
        return;
      }

      const responseData = await response.json();
      // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
      const data = (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData)
        ? responseData.data
        : responseData;
      if (data && data.isMultiTenant) {
        await loadAccessibleTenants();
        setShowTenantSelection(true);
        return;
      }

      // 단일 테넌트 또는 멀티 테넌트가 아닌 경우: redirect 파라미터 확인 후 리다이렉트
      const searchParams = new URLSearchParams(location.search);
      const redirectPath = searchParams.get('redirect');

      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: user,
          isMultiTenant: false
        };
        await redirectToDynamicDashboard(authResponse, navigate);
      }
    } catch (error) {
      console.error('멀티 테넌트 확인 오류:', error);
    }
  };

  // 접근 가능한 테넌트 목록 로드
  const loadAccessibleTenants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/tenant/accessible`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccessibleTenants(data.tenants || []);
        }
      }
    } catch (error) {
      console.error('테넌트 목록 로드 오류:', error);
    }
  };

  // ID/PW 로그인 처리
  const handleSubmit = async (e) => {
    console.log('🚀 handleSubmit 함수 호출됨!', e);

    const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 서브도메인 확인 (로컬 환경에서는 스킵, 프로덕션에서는 서브도메인 필수)
    if (!isLocalEnv) {
      const host = window.location.hostname;
      const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
      const hostParts = host.split('.');
      const firstLabel = hostParts[0];
      const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;

      if (!hasSubdomain) {
        const friendlyMessage = '서브도메인이 필요합니다.\n\n예: coresolution.dev.core-solution.co.kr\n\n현재 도메인: ' + host + '\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.';
        console.error('⚠️ 서브도메인 없음:', friendlyMessage);
        showTooltip(friendlyMessage, 'error');
        notificationManager.show(friendlyMessage, 'error');
        setIsLoading(false);
        return;
      }
    }
    e.preventDefault();

    // DOM에서 직접 값 가져오기
    const formElement = e.target;
    const emailInput = formElement.querySelector('input[name="email"]');
    const passwordInput = formElement.querySelector('input[name="password"]');

    const actualFormData = {
      email: emailInput?.value || '',
      password: passwordInput?.value || ''
    };

    if (!actualFormData.email || !actualFormData.password) {
      console.log('❌ 폼 데이터 유효성 검사 실패');
      showTooltip(LOGIN_IDENTIFIER_PASSWORD_REQUIRED, 'warning');
      return;
    }

    console.log('✅ 폼 데이터 유효성 검사 통과');
    setIsLoading(true);
    try {
      const result = await authAPI.login(actualFormData);
      console.log('🔐 로그인 응답:', result);

      // ApiResponse 래퍼 처리: result.data 또는 result 직접 사용
      const loginData = result.data || result;

      // 중복 로그인 확인 요청 체크 (성공 체크보다 먼저)
      if (loginData.requiresConfirmation || result.data?.requiresConfirmation || result.requiresConfirmation) {
        // 중복 로그인 확인 요청 — DuplicateLoginModal은 loginData만 사용(onConfirm/onCancel 미사용)
        setIsLoading(false);
        const modalData = {
          isOpen: true,
          message: (result.data?.message || result.message || loginData.message) || '다른 기기에서 로그인되어 있습니다. 계속하시겠습니까?',
          loginData: {
            email: actualFormData.email,
            password: actualFormData.password
          }
        };
        setDuplicateLoginModal(modalData);
        return;
      }

      if (result.success && loginData.user) {
        // tenantId 확인 로그
        console.log('🔍 로그인 응답 user 객체:', loginData.user);
        console.log('🔍 로그인 응답 user.tenantId:', loginData.user.tenantId);
        console.log('🔍 로그인 응답 userResponse:', loginData.userResponse);
        console.log('🔍 로그인 응답 userResponse?.tenantId:', loginData.userResponse?.tenantId);

        // userResponse에 tenantId가 있으면 user에도 설정
        if (loginData.userResponse && loginData.userResponse.tenantId && !loginData.user.tenantId) {
          console.log('✅ userResponse에서 tenantId 복사:', loginData.userResponse.tenantId);
          loginData.user.tenantId = loginData.userResponse.tenantId;
        }

        // sessionManager에 사용자 정보 설정 (세션 기반이므로 토큰 없음)
        sessionManager.setUser(loginData.user, {
          sessionId: loginData.sessionId
        });
        // SessionContext 동기화 (로그인 직후 공통코드 등에서 user 사용 가능하도록)
        await checkSession(true);

        // 로그인 직후 플래그 설정 (세션 체크 시 리다이렉트 방지)
        sessionStorage.setItem('justLoggedIn', 'true');

        showTooltip('로그인에 성공했습니다.', 'success');

        // 임시 비밀번호로 로그인한 경우 비밀번호 변경 모달 표시
        if (result.data?.requiresPasswordChange || loginData.requiresPasswordChange) {
          console.log('⚠️ 임시 비밀번호로 로그인 감지 - 비밀번호 변경 모달 표시');
          // 입력한 비밀번호를 임시 비밀번호로 저장 (비밀번호 변경 모달에서 현재 비밀번호로 사용)
          setTempPassword(actualFormData.password);
          setIsLoading(false);
          setShowPasswordChangeModal(true);
          return; // 비밀번호 변경 완료 전까지 리다이렉트하지 않음
        }

        // 백엔드에서 반환한 멀티 테넌트 정보 확인
        if (loginData.isMultiTenant && loginData.requiresTenantSelection && loginData.accessibleTenants) {
          // 멀티 테넌트 사용자: 테넌트 선택 화면 표시
          console.log('🔄 멀티 테넌트 사용자 감지:', loginData.accessibleTenants);
          setAccessibleTenants(loginData.accessibleTenants);
          setShowTenantSelection(true);
          setIsLoading(false);
          return;
        }

        // 단일 테넌트 사용자: redirect 파라미터 확인 후 리다이렉트
        const searchParams = new URLSearchParams(location.search);
        const redirectPath = searchParams.get('redirect');

        try {
          if (redirectPath) {
            navigate(redirectPath, { replace: true });
          } else {
            await new Promise((resolve) => setTimeout(resolve, 300));
            const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
            await redirectToDynamicDashboard(loginData, navigate);
          }
        } finally {
          // navigate 직후에도 로딩 스피너가 남는 경우(세션·라우팅 지연) 방지
          setIsLoading(false);
        }
      } else {
        console.log('❌ 로그인 실패:', result.message);
        setIsLoading(false);
        
        // 서브도메인 관련 오류인 경우 명확한 메시지 표시 (로컬 환경에서는 원본 에러 표시)
        const errorMessage = result.message || '';
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalEnv && (errorMessage.includes('테넌트 정보가 없습니다') ||
            errorMessage.includes('서브도메인') ||
            errorMessage.includes('TENANT_REQUIRED'))) {
          const friendlyMessage = '서브도메인이 필요합니다.\n\n예: coresolution.dev.core-solution.co.kr\n\n현재 도메인: ' + window.location.hostname + '\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.';
          showTooltip(friendlyMessage, 'error');
          notificationManager.show(friendlyMessage, 'error');
        } else {
          showTooltip(LOGIN_CREDENTIALS_MISMATCH_MESSAGE, 'error');
        }
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      setIsLoading(false);
      
      // 서브도메인 관련 오류인 경우 명확한 메시지 표시 (로컬 환경에서는 원본 에러 표시)
      const errorMessage = error.message || '';
      const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalEnv && (error.isSubdomainError ||
          errorMessage.includes('테넌트 정보가 없습니다') ||
          errorMessage.includes('서브도메인') ||
          errorMessage.includes('TENANT_REQUIRED'))) {
        const friendlyMessage = errorMessage.includes('서브도메인이 필요합니다')
          ? errorMessage
          : '서브도메인이 필요합니다.\n\n예: coresolution.dev.core-solution.co.kr\n\n현재 도메인: ' + window.location.hostname + '\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.';
        showTooltip(friendlyMessage, 'error');
        notificationManager.show(friendlyMessage, 'error');
      } else {
        const msg = isLocalEnv && error.message ? error.message : LOGIN_CREDENTIALS_MISMATCH_MESSAGE;
        showTooltip(msg, 'error');
      }
    }
  };

  // 소셜 로그인 핸들러
  const handleKakaoLogin = async () => {
    try {
      await kakaoLogin();
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      showTooltip('카카오 로그인을 시작할 수 없습니다.', 'error');
    }
  };

  const handleNaverLogin = async () => {
    try {
      await naverLogin();
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      showTooltip('네이버 로그인을 시작할 수 없습니다.', 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      showTooltip('구글 로그인을 시작할 수 없습니다.', 'error');
    }
  };

  // 테넌트 선택 완료 핸들러 (TenantSelection에서 직접 처리하도록 변경) - 미사용
  /*
  const handleTenantSelected = async (tenantId) => {
    // TenantSelection 컴포넌트에서 직접 처리하므로 여기서는 호출만
    console.log('🔄 테넌트 선택 요청:', tenantId);
  };
  */

  // 입력 핸들러
  const handleInputChange = (e) => {
    console.log('🔄 handleInputChange 호출됨:', e.target.name, '값:', e.target.value);
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      console.log('📝 formData 업데이트:', newFormData);
      return newFormData;
    });
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // 테넌트 선택 화면이 표시되면 TenantSelection 컴포넌트 렌더링
  if (showTenantSelection) {
    return (
      <TenantSelection
        tenants={accessibleTenants}
        onSelect={null} // TenantSelection에서 직접 처리
        onCancel={async () => {
          setShowTenantSelection(false);
          await sessionManager.logout();
          navigate('/login');
        }}
      />
    );
  }

  return (
    <CommonPageTemplate bodyClass="login-page">
      <div className="mg-v2-login-container">
        {/* 좌측: 브랜딩 이미지 영역 */}
        <div className="mg-v2-login-hero">
          <div className="mg-v2-login-hero-content">
            <h1 className="mg-v2-login-hero-logo">CoreSolution</h1>
            <p className="mg-v2-login-hero-slogan">마음의 평화를 가꾸는 공간</p>
          </div>
        </div>

        {/* 우측: 로그인 폼 영역 */}
        <div className="mg-v2-login-content">
          <div className="mg-v2-login-form-wrapper">
            <div className="mg-v2-login-header">
              <h1 className="mg-v2-login-title">환영합니다</h1>
              <p className="mg-v2-login-subtitle">CoreSolution 서비스에 로그인하세요.</p>
            </div>

            {/* ID/PW 로그인 폼 */}
            <form onSubmit={handleSubmit} className="mg-v2-login-form">
              <div className="mg-v2-field">
                <label htmlFor="email" className="mg-v2-label">{LOGIN_IDENTIFIER_LABEL}</label>
                <p className="mg-v2-text-secondary mg-v2-text-sm" id="login-identifier-hint">
                  {LOGIN_IDENTIFIER_FIELD_HINT}
                </p>
                <input
                  id="email"
                  type="text"
                  name="email"
                  autoComplete="username"
                  defaultValue={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => console.log('📧 이메일 필드 포커스됨')}
                  onBlur={() => console.log('📧 이메일 필드 포커스 해제됨')}
                  className="mg-v2-input"
                  placeholder={LOGIN_IDENTIFIER_PLACEHOLDER}
                  required
                  aria-describedby="login-identifier-hint"
                />
              </div>

              <div className="mg-v2-field">
                <label htmlFor="password" className="mg-v2-label">비밀번호</label>
                <div className="mg-v2-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    defaultValue={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => console.log('🔒 비밀번호 필드 포커스됨')}
                    onBlur={() => console.log('🔒 비밀번호 필드 포커스 해제됨')}
                    className="mg-v2-input"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="mg-v2-password-toggle"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {tooltip.show && (
                <div className={`mg-v2-tooltip mg-v2-tooltip--${tooltip.type}`}>
                  {tooltip.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mg-v2-button-primary"
              >
                {isLoading ? <div className="mg-loading">로딩중...</div> : '로그인'}
              </button>
            </form>

            {/* 소셜 로그인 버튼 */}
            <div className="mg-v2-login-social">
              <div className="mg-v2-divider">
                <span>또는 다음으로 로그인</span>
              </div>

              <div className="mg-v2-social-buttons">
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  className="mg-v2-button-social mg-v2-button-kakao"
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M12 3.375c-5.385 0-9.75 3.442-9.75 7.688 0 2.745 1.825 5.153 4.57 6.514-.15.515-.96 3.313-.992 3.533 0 0 .017.214.088.228.07.014.233-.014.233-.014.307-.043 3.557-2.326 4.12-2.723.562.08 1.14.121 1.732.121 5.385 0 9.75-3.442 9.75-7.688S17.385 3.375 12 3.375z" 
                      fill="#000000"
                    />
                  </svg>
                  카카오 로그인
                </button>

                <button
                  type="button"
                  onClick={handleNaverLogin}
                  className="mg-v2-button-social mg-v2-button-naver"
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12.067 9.599L6.5 1.933H2v14.134h4.433V8.401l5.567 7.666H16V1.933h-4.433v7.666z" 
                      fill="#FFFFFF"
                    />
                  </svg>
                  네이버 로그인
                </button>

                {oauth2Config?.google && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mg-v2-button-social mg-v2-button-google"
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 18 18" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    구글 로그인
                  </button>
                )}
              </div>
            </div>

            {/* 추가 링크 */}
            <div className="mg-v2-login-links">
              <a href="/register" className="mg-v2-link">
                회원가입
              </a>
              <span className="mg-v2-link-separator"></span>
              <a href="/forgot-password" className="mg-v2-link">
                비밀번호 찾기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 (임시 비밀번호로 로그인한 경우) */}
      {showPasswordChangeModal && (
        <PasswordChangeModal
          isOpen={showPasswordChangeModal}
          tempPassword={tempPassword} // 임시 비밀번호 전달 (현재 비밀번호로 자동 입력)
          onClose={() => {
            // 비밀번호 변경 모달을 닫을 수 없도록 설정 (임시 비밀번호인 경우 필수)
            notificationManager.show('임시 비밀번호를 변경해야 합니다.', 'warning');
          }}
          onSuccess={async () => {
            // 비밀번호 변경 성공 시 대시보드로 리다이렉트
            console.log('✅ 비밀번호 변경 완료 - 대시보드로 리다이렉트');
            setShowPasswordChangeModal(false);
            setTempPassword(''); // 임시 비밀번호 초기화
            
            // 세션 정보 다시 확인 후 대시보드로 이동
            try {
              const checkResult = await checkSession(true);
              if (checkResult && user) {
                const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
                await redirectToDynamicDashboard({ user }, navigate);
              } else {
                // 세션 확인 실패 시 로그인 페이지로 이동
                navigate('/login');
              }
            } catch (error) {
              console.error('❌ 세션 확인 실패:', error);
              navigate('/login');
            }
          }}
        />
      )}

      {/* 소셜 회원가입 모달 */}
      {showSocialSignupModal && (
        <SocialSignupModal
          isOpen={showSocialSignupModal}
          onClose={() => setShowSocialSignupModal(false)}
          socialUser={socialUserInfo}
          onSignupSuccess={(response) => {
            console.log('✅ 소셜 회원가입 성공:', response);
            notificationManager.show('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
            setShowSocialSignupModal(false);
            navigate('/login');
          }}
        />
      )}
    </CommonPageTemplate>
  );
};

export default UnifiedLogin;

