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
import { useTranslation } from 'react-i18next';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { API_BASE_URL } from '../../constants/api';
import { LOGIN_SESSION_CHECK_DELAY } from '../../constants/session';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import { sessionManager } from '../../utils/sessionManager';
import { appleLogin, googleLogin, kakaoLogin, naverLogin } from '../../utils/socialLogin';
import {
  OAUTH2_LOGIN_UI,
  isGoogleWebClientIdConfigured
} from '../../constants/oauth2';
import { requestGoogleSocialLogin } from '../../services/oauth2/googleWebOAuth2Service';
import GoogleLoginButton from './GoogleLoginButton';
import GoogleBrandLogo from './GoogleBrandLogo';
import OAuthPhoneVerificationModal from './OAuthPhoneVerificationModal';
import { setLoginSession } from '../../utils/session';
import CommonPageTemplate from '../common/CommonPageTemplate';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SocialSignupModal from './SocialSignupModal';
import TenantSelection from './TenantSelection';
import PasswordChangeModal from '../mypage/components/PasswordChangeModal';
// @deprecated 레거시 함수는 하위 호환성을 위해 유지하되, 새로운 코드에서는 사용하지 않음
// import { getDashboardPath, redirectToDashboardWithFallback } from '../../utils/session';
import '../../styles/auth/UnifiedLogin.css';
import notificationManager from '../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import { SESSION_SUBDOMAIN_TENANT_NAME_KEY } from '../../utils/tenantDisplayName';
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
  LOGIN_IDENTIFIER_PLACEHOLDER,
  OAUTH_SIGNUP_REQUIRED_PROMPT,
  OAUTH_POST_SIGNUP_LOGIN_REMINDER
} from '../../constants/loginDisplay';

const UnifiedLogin = () => {
  console.log('🚀 UnifiedLogin 컴포넌트 렌더링 시작');
  const { t } = useTranslation(['common', 'auth']);
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
  // GIS 웹 흐름 OAuth 휴대폰 매칭(OTP) 모달 — `OAuthPhoneVerificationModal` 표시 여부와 BE payload 보관.
  const [showOAuthPhoneVerificationModal, setShowOAuthPhoneVerificationModal] = useState(false);
  const [oauthPhoneVerificationPayload, setOAuthPhoneVerificationPayload] = useState(null);
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
    const detectTenantFromSubdomain = async() => {
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

        const { host } = window.location;
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
              const { tenantId } = tenantData.tenant;
              console.log('✅ 서브도메인으로 tenant_id 조회 성공: tenantId=', tenantId);

              // sessionStorage에 저장 (SNS 로그인 시 사용)
              sessionStorage.setItem('subdomain_tenant_id', tenantId);
              sessionStorage.setItem('subdomain', subdomain);
              const tenantNameRaw = tenantData.tenant.name;
              const tenantName = toDisplayString(tenantNameRaw, '').trim();
              sessionStorage.setItem(
                SESSION_SUBDOMAIN_TENANT_NAME_KEY,
                tenantName || subdomain
              );
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

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('signup') === 'success' && q.get('email')) {
      setFormData((prev) => ({ ...prev, email: q.get('email') }));
    }
  }, [location.search]);

  // useSession에서 사용자 정보가 감지되면, 실제 세션(200) 검증 후에만 리다이렉트
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('logout') === 'success' || q.get('logout') === 'error') {
      return;
    }
    if (!user?.id || isLoading || tooltip.show) return;
    let cancelled = false;
    (async() => {
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
  const getOAuth2Config = async() => {
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
      notificationManager.show(t('auth:unifiedLogin.msg.logoutSuccess'), 'success');
      
      // 서브도메인 확인 및 안내
      const host = window.location.hostname;
      const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
      const hostParts = host.split('.');
      const firstLabel = hostParts[0];
      const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;
      
      // 서브도메인이 없으면 안내 메시지 추가
      if (!hasSubdomain && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const subdomainMessage = t('auth:unifiedLogin.msg.subdomainWarning');
        setTimeout(() => {
          showTooltip(subdomainMessage, 'warning');
          notificationManager.show(subdomainMessage, 'warning');
        }, 1000);
      }
      
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
    } else if (logoutStatus === 'error') {
      const errorMsg = logoutMessage ? decodeURIComponent(logoutMessage) : t('auth:unifiedLogin.msg.logoutError');
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

    const oauthLegacy = searchParams.get('oauth');
    if (oauthLegacy === 'success' && provider) {
      const mapped = new URLSearchParams(location.search);
      mapped.delete('oauth');
      mapped.set('success', 'true');
      navigate(`/auth/oauth2/callback?${mapped.toString()}`, { replace: true });
      return;
    }

    // OAuth 오류 처리 (서브도메인 없음 등)
    if (error) {
      try {
        const decodedError = decodeURIComponent(error);
        console.log('🔤 디코딩된 OAuth 에러 메시지:', decodedError);
        
        // 서브도메인 관련 오류인 경우 명확한 메시지 표시 (로컬 환경에서는 원본 에러 표시)
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalEnv && (decodedError.includes('테넌트 정보가 없습니다') || decodedError.includes('서브도메인'))) {
          const host = window.location.hostname;
          const friendlyMessage = t('auth:unifiedLogin.msg.subdomainRequired', { host });
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
        showTooltip(t('auth:unifiedLogin.msg.oauthGeneralError'), 'error');
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
      const providerUpper = String(provider || '').trim().toUpperCase();

      console.log('📝 간편 회원가입 필요 감지 (signup=required):', { provider: providerUpper, tenantId, email });
      notificationManager.show(
        OAUTH_SIGNUP_REQUIRED_PROMPT,
        'info'
      );

      setSocialUserInfo({
        provider: providerUpper || provider,
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
  const checkMultiTenantAndRedirect = async(user) => {
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
  const loadAccessibleTenants = async() => {
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
  const handleSubmit = async(e) => {
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
        const friendlyMessage = t('auth:unifiedLogin.msg.subdomainRequired', { host });
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
          message: (result.data?.message || result.message || loginData.message) || t('auth:unifiedLogin.msg.duplicateLoginPrompt'),
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

        showTooltip(t('auth:unifiedLogin.msg.loginSuccess'), 'success');

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
          const friendlyMessage = t('auth:unifiedLogin.msg.subdomainRequired', { host: window.location.hostname });
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
          : t('auth:unifiedLogin.msg.subdomainRequired', { host: window.location.hostname });
        showTooltip(friendlyMessage, 'error');
        notificationManager.show(friendlyMessage, 'error');
      } else {
        const msg = isLocalEnv && error.message ? error.message : LOGIN_CREDENTIALS_MISMATCH_MESSAGE;
        showTooltip(msg, 'error');
      }
    }
  };

  // 소셜 로그인 핸들러
  const handleKakaoLogin = async() => {
    try {
      await kakaoLogin();
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      showTooltip(t('auth:unifiedLogin.socialLogin.kakaoFailed'), 'error');
    }
  };

  const handleNaverLogin = async() => {
    try {
      await naverLogin();
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      showTooltip(t('auth:unifiedLogin.socialLogin.naverFailed'), 'error');
    }
  };

  /**
   * 레거시 Google 로그인 — `GOOGLE_WEB_CLIENT_ID` 가 미주입된 환경에서만 fallback 으로 사용한다.
   * GIS Provider 마운트 시(`isGoogleWebClientIdConfigured === true`)에는
   * {@link handleGoogleWebSuccess} 가 처리하므로 본 핸들러는 호출되지 않는다.
   */
  const handleGoogleLogin = async() => {
    try {
      await googleLogin();
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      showTooltip(t('auth:unifiedLogin.socialLogin.googleFailed'), 'error');
    }
  };

  /**
   * GIS implicit 흐름에서 access_token 을 받은 직후 BE `/social-login` 으로 매칭 요청.
   * BE 응답을 분기 처리한다(authenticated / requiresOAuthPhoneVerification /
   * requiresPhoneAccountSelection / requiresSignup / error).
   */
  const handleGoogleWebSuccess = async({ accessToken, idToken }) => {
    setIsLoading(true);
    try {
      const outcome = await requestGoogleSocialLogin({ accessToken, idToken });
      console.log('🔐 Google 웹 로그인 outcome:', outcome.kind);

      if (outcome.kind === 'authenticated') {
        setLoginSession(outcome.user, {
          accessToken: outcome.accessToken,
          refreshToken: outcome.refreshToken
        });
        sessionStorage.setItem('justLoggedIn', 'true');
        showTooltip(t('auth:unifiedLogin.msg.loginSuccess'), 'success');
        await checkSession(true);
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        await redirectToDynamicDashboard({ user: outcome.user }, navigate);
        return;
      }

      if (outcome.kind === 'requiresOAuthPhoneVerification') {
        setOAuthPhoneVerificationPayload({
          provider: 'GOOGLE',
          phoneVerificationToken: outcome.phoneVerificationToken,
          email: outcome.socialUserInfo?.email || null,
          name: outcome.socialUserInfo?.name || null,
          nickname: outcome.socialUserInfo?.nickname || null
        });
        setShowOAuthPhoneVerificationModal(true);
        setIsLoading(false);
        return;
      }

      if (outcome.kind === 'requiresPhoneAccountSelection') {
        try {
          sessionStorage.setItem('oauth_phone_selection_token', outcome.selectionToken);
          sessionStorage.setItem('oauth_phone_selection_provider', 'GOOGLE');
        } catch (storageErr) {
          console.error('sessionStorage 저장 실패:', storageErr);
        }
        navigate('/oauth-account-selection');
        return;
      }

      if (outcome.kind === 'requiresSignup') {
        const tenantId = sessionStorage.getItem('subdomain_tenant_id');
        notificationManager.show(OAUTH_SIGNUP_REQUIRED_PROMPT, 'info');
        setSocialUserInfo({
          provider: 'GOOGLE',
          providerUserId: outcome.socialUserInfo.providerUserId,
          email: outcome.socialUserInfo.email,
          name: outcome.socialUserInfo.name,
          nickname: outcome.socialUserInfo.nickname,
          profileImageUrl: outcome.socialUserInfo.profileImageUrl,
          tenantId: tenantId || null
        });
        setShowSocialSignupModal(true);
        setIsLoading(false);
        return;
      }

      // error 분기.
      const message = outcome.message || t('auth:unifiedLogin.socialLogin.googleFailed');
      showTooltip(message, 'error');
    } catch (error) {
      console.error('Google 웹 로그인 처리 오류:', error);
      showTooltip(t('auth:unifiedLogin.socialLogin.googleFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleWebError = (message) => {
    console.error('Google 웹 로그인 오류:', message);
    // 사용자가 popup 을 닫은 경우(`popup_closed_by_user`)는 무시한다.
    const lower = String(message || '').toLowerCase();
    if (lower.includes('popup_closed') || lower.includes('user_cancelled')) {
      return;
    }
    showTooltip(t('auth:unifiedLogin.socialLogin.googleFailed'), 'error');
  };

  /**
   * Apple Sign in with Apple (SIWA) — server-side auth-code 흐름 (2026-06-11, Google PR #204 패턴).
   *
   * <p>handleGoogleLogin 100% mirror — `appleLogin()` 가 BE `/api/v1/auth/oauth2/apple/authorize`
   * 로부터 authorize URL 을 받아 SPA 를 full redirect 한다. Apple → BE apex 콜백
   * (`/api/v1/auth/apple/callback`, form-urlencoded POST) → 테넌트 SPA `/auth/oauth2/callback`
   * 로 302 redirect.</p>
   *
   * <p>이전 `usePopup=true` + `requestAppleSignIn()` + `signInWithApple()` 흐름은 멀티테넌트
   * 와일드카드 환경에서 popup parent origin 과 redirect_uri origin 동일성 강제로 거절
   * (빨간 배너)되어 폐기. 모바일 native SIWA 는 별도 경로(`/api/v1/auth/oauth/apple/login`)
   * 를 그대로 사용하므로 회귀 0.</p>
   */
  const handleAppleLogin = async() => {
    try {
      await appleLogin();
    } catch (error) {
      console.error('Apple 로그인 오류:', error);
      showTooltip(t('auth:unifiedLogin.socialLogin.appleFailed'), 'error');
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
        onCancel={async() => {
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
            <h1 className="mg-v2-login-hero-logo">{t('auth:unifiedLogin.heroLogo', 'CoreSolution')}</h1>
            <p className="mg-v2-login-hero-slogan">{t('auth:unifiedLogin.heroSlogan')}</p>
          </div>
        </div>

        {/* 우측: 로그인 폼 영역 */}
        <div className="mg-v2-login-content">
          <div className="mg-v2-login-form-wrapper">
            <div className="mg-v2-login-header">
              <h1 className="mg-v2-login-title">{t('auth:unifiedLogin.title')}</h1>
              <p className="mg-v2-login-subtitle">{t('auth:unifiedLogin.subtitle')}</p>
            </div>

            {new URLSearchParams(location.search).get('signup') === 'success' && (
              <section className="mg-v2-field" aria-labelledby="oauth-post-signup-title">
                <h2 id="oauth-post-signup-title" className="mg-v2-label">
                  {OAUTH2_LOGIN_UI.POST_SIGNUP_CALLOUT_TITLE}
                </h2>
                <p className="mg-v2-text-secondary mg-v2-text-sm">
                  {OAUTH2_LOGIN_UI.POST_SIGNUP_CALLOUT_BODY}
                </p>
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
                  onClick={() => {
                    const q = new URLSearchParams(location.search);
                    const em = q.get('email');
                    const next = em
                      ? `/login?email=${encodeURIComponent(em)}`
                      : '/login';
                    window.history.replaceState({}, document.title, next);
                    notificationManager.show(
                      t('auth:unifiedLogin.msg.passwordReentryHint'),
                      'info'
                    );
                    setTimeout(() => {
                      const el = document.getElementById('password');
                      if (el) {
                        el.focus();
                      }
                    }, 0);
                  }}
                >
                  {OAUTH2_LOGIN_UI.POST_SIGNUP_PRIMARY_CTA}
                </MGButton>
              </section>
            )}

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
                <label htmlFor="password" className="mg-v2-label">{t('auth:unifiedLogin.passwordLabel')}</label>
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
                    placeholder={t('auth:unifiedLogin.passwordPlaceholder')}
                    required
                  />
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={togglePassword}
                    className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-password-toggle`}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    preventDoubleClick={false}
                    aria-label={showPassword ? t('auth:common.passwordHide') : t('auth:common.passwordShow')}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </MGButton>
                </div>
              </div>

              {tooltip.show && (
                <div className={`mg-v2-tooltip mg-v2-tooltip--${tooltip.type}`}>
                  {tooltip.message}
                </div>
              )}

              <MGButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                loading={isLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })}
                preventDoubleClick={false}
              >
                {t('auth:unifiedLogin.loginButton')}
              </MGButton>
            </form>

            {/* 소셜 로그인 버튼 */}
            <div className="mg-v2-login-social">
              <div className="mg-v2-divider">
                <span>{t('auth:unifiedLogin.dividerLabel')}</span>
              </div>

              <div className="mg-v2-social-buttons">
                <MGButton
                  type="button"
                  variant="outline"
                  onClick={handleKakaoLogin}
                  className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-kakao`}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
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
                      fill="currentColor"
                    />
                  </svg>
                  {t('auth:unifiedLogin.socialLogin.kakao')}
                </MGButton>

                <MGButton
                  type="button"
                  variant="outline"
                  onClick={handleNaverLogin}
                  className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-naver`}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
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
                      fill="currentColor"
                    />
                  </svg>
                  {t('auth:unifiedLogin.socialLogin.naver')}
                </MGButton>

                {/*
                  Google 로그인 — server-side auth-code 흐름 (PR #211, 2026-06-11).
                  BE 가 `/api/v1/auth/oauth2/google/authorize` 에서 client_id 와 authorize URL 을
                  생성하므로 FE 의 `REACT_APP_GOOGLE_CLIENT_ID` 주입 여부와 무관하게 버튼을 노출한다.

                  - `isGoogleWebClientIdConfigured === true`: GIS 로고 자산을 포함한
                    `GoogleLoginButton` (server-side 흐름으로 redirect; onSuccess 호출되지 않음 —
                    BE 가 `/api/v1/auth/google/callback` → `/auth/oauth2/callback` 처리).
                  - `isGoogleWebClientIdConfigured === false`: 동일한 server-side 흐름으로 redirect
                    하는 폴백 `MGButton`. 가드를 제거한 이유는 PR #211 server-side 전환 후
                    FE client_id 미주입 운영 빌드에서도 버튼을 정상 노출해야 하기 때문.
                */}
                {isGoogleWebClientIdConfigured ? (
                  <GoogleLoginButton
                    onError={handleGoogleWebError}
                    disabled={isLoading}
                    label={t('auth:unifiedLogin.socialLogin.google')}
                  />
                ) : (
                  <MGButton
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-google`}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    preventDoubleClick={false}
                  >
                    <GoogleBrandLogo />
                    {t('auth:unifiedLogin.socialLogin.google')}
                  </MGButton>
                )}

                {/*
                  Apple Sign In — server-side auth-code 흐름 (PR #211, 2026-06-11).
                  BE `/api/v1/auth/oauth2/apple/authorize` 가 client_id·Service ID·JWT 서명까지
                  처리하므로 FE `REACT_APP_APPLE_CLIENT_ID` 주입 여부와 무관하게 버튼을 노출한다.

                  이전 Apple JS SDK (`appleid.auth.js`) 흐름은 멀티테넌트 와일드카드에서 거절되어
                  폐기됐고, 그에 맞춰 `isAppleWebServiceIdConfigured` 가드도 함께 제거했다.
                  Apple HIG 자산(검정 배경 + 흰색 로고/텍스트) 및 App Store 4.8 T1 대응 유지.
                */}
                <MGButton
                  type="button"
                  variant="outline"
                  onClick={handleAppleLogin}
                  className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-apple`}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
                  aria-label={t('auth:unifiedLogin.socialLogin.apple', 'Apple로 계속하기')}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* Apple 공식 로고 path — Apple HIG 자산 (브랜드 색상은 CSS 토큰으로 처리). */}
                    <path
                      d="M17.05 12.04c-.03-3 2.45-4.44 2.56-4.51-1.4-2.04-3.57-2.32-4.34-2.36-1.85-.19-3.6 1.09-4.54 1.09-.94 0-2.39-1.06-3.92-1.04-2.02.03-3.88 1.17-4.92 2.97-2.1 3.64-.54 9.03 1.5 11.99 1 1.46 2.19 3.1 3.75 3.04 1.5-.06 2.07-.97 3.89-.97s2.32.97 3.91.94c1.61-.03 2.63-1.48 3.61-2.95 1.14-1.68 1.6-3.31 1.63-3.39-.04-.02-3.13-1.2-3.13-4.81zM14.05 3.21c.82-1 1.38-2.38 1.23-3.76-1.18.05-2.62.79-3.47 1.78-.76.88-1.43 2.3-1.25 3.65 1.32.1 2.66-.67 3.49-1.67z"
                      fill="currentColor"
                    />
                  </svg>
                  {t('auth:unifiedLogin.socialLogin.apple', 'Apple로 계속하기')}
                </MGButton>
              </div>
            </div>

            {/* 추가 링크 */}
            <div className="mg-v2-login-links">
              <a href="/register" className="mg-v2-link">
                {t('auth:unifiedLogin.links.register')}
              </a>
              <span className="mg-v2-link-separator" />
              <a href="/forgot-password" className="mg-v2-link">
                {t('auth:unifiedLogin.links.forgotPassword')}
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
            notificationManager.show(t('auth:common.tempPasswordChangeRequired'), 'warning');
          }}
          onSuccess={async() => {
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
            notificationManager.show(
              OAUTH_POST_SIGNUP_LOGIN_REMINDER,
              'success'
            );
            setShowSocialSignupModal(false);
            navigate('/login');
          }}
        />
      )}

      {/* GIS 웹 흐름 OAuth 휴대폰 매칭 모달 — Google 로그인 1차 응답이 OTP 매칭을 요구할 때 */}
      {showOAuthPhoneVerificationModal && oauthPhoneVerificationPayload && (
        <OAuthPhoneVerificationModal
          isOpen={showOAuthPhoneVerificationModal}
          onClose={() => {
            setShowOAuthPhoneVerificationModal(false);
            setOAuthPhoneVerificationPayload(null);
          }}
          socialUser={oauthPhoneVerificationPayload}
          onVerifiedSingle={async({ accessToken, refreshToken, matchedAccount, provider: matchedProvider }) => {
            const userInfo = {
              id: matchedAccount?.userId,
              tenantId: matchedAccount?.tenantId,
              role: matchedAccount?.role,
              provider: matchedProvider
            };
            setLoginSession(userInfo, {
              accessToken,
              refreshToken: refreshToken || accessToken
            });
            sessionStorage.setItem('justLoggedIn', 'true');
            setShowOAuthPhoneVerificationModal(false);
            setOAuthPhoneVerificationPayload(null);
            await checkSession(true);
            const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
            await redirectToDynamicDashboard({ user: userInfo }, navigate);
          }}
          onRequiresAccountSelection={({ phoneAccountSelectionToken, provider: matchedProvider }) => {
            try {
              sessionStorage.setItem('oauth_phone_selection_token', phoneAccountSelectionToken);
              sessionStorage.setItem('oauth_phone_selection_provider', matchedProvider);
            } catch (storageErr) {
              console.error('sessionStorage 저장 실패:', storageErr);
            }
            setShowOAuthPhoneVerificationModal(false);
            setOAuthPhoneVerificationPayload(null);
            navigate('/oauth-account-selection');
          }}
          onTokenExpired={() => {
            setShowOAuthPhoneVerificationModal(false);
            setOAuthPhoneVerificationPayload(null);
            notificationManager.show(
              t('auth:unifiedLogin.msg.oauthSessionExpired', '인증 세션이 만료되었습니다. 다시 로그인해 주세요.'),
              'error'
            );
          }}
        />
      )}
    </CommonPageTemplate>
  );
};

export default UnifiedLogin;

