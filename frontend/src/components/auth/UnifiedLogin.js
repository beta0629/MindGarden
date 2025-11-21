/**
 * 통합 로그인 컴포넌트
 * Phase 3: 통합 로그인 시스템 프론트엔드
 * 
 * 모든 업종 통합 로그인 페이지
 * - ID/PW 로그인
 * - 소셜 로그인 (Kakao/Naver/Google/Apple)
 * - 테넌트 자동 감지 및 라우팅
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleLayout from '../layout/SimpleLayout';
import SocialSignupModal from './SocialSignupModal';
import DuplicateLoginModal from '../common/DuplicateLoginModal';
import TenantSelection from './TenantSelection';
import { authAPI } from '../../utils/ajax';
import { API_BASE_URL } from '../../constants/api';
import { kakaoLogin, naverLogin, googleLogin } from '../../utils/socialLogin';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { LOGIN_SESSION_CHECK_DELAY } from '../../constants/session';
// @deprecated 레거시 함수는 하위 호환성을 위해 유지하되, 새로운 코드에서는 사용하지 않음
// import { getDashboardPath, redirectToDashboardWithFallback } from '../../utils/session';
import notificationManager from '../../utils/notification';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { TABLET_LOGIN_CONSTANTS, COMPONENT_CSS } from '../../constants/css-variables';
import '../../styles/auth/UnifiedLogin.css';

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, checkSession, setDuplicateLoginModal } = useSession();
  
  // URL 파라미터에서 email과 redirect 가져오기
  const searchParams = new URLSearchParams(location.search);
  const emailFromUrl = searchParams.get('email');
  const redirectFromUrl = searchParams.get('redirect');
  
  const [formData, setFormData] = useState({
    email: emailFromUrl || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [oauth2Config, setOauth2Config] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialSignupModal, setShowSocialSignupModal] = useState(false);
  const [socialUserInfo, setSocialUserInfo] = useState(null);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [isMultiTenant, setIsMultiTenant] = useState(false);

  // 툴팁 상태
  const [tooltip, setTooltip] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  // 툴팁 표시 함수
  const showTooltip = (message, type = 'error') => {
    setTooltip({ show: true, message, type });
    setTimeout(() => {
      setTooltip({ show: false, message: '', type: 'error' });
    }, 6000);
  };

  useEffect(() => {
    getOAuth2Config();
    checkOAuthCallback();
    checkExistingSession();
  }, [location]);

  // OAuth2 설정 가져오기
  const getOAuth2Config = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/config/oauth2`);
      if (response.ok) {
        const config = await response.json();
        setOauth2Config(config);
      }
    } catch (error) {
      console.error('OAuth2 설정 로드 실패:', error);
    }
  };

  // OAuth 콜백 확인
  const checkOAuthCallback = () => {
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');
    const provider = searchParams.get('provider');
    
    if (success === 'true' && provider) {
      // OAuth2Callback 컴포넌트에서 처리하도록 리다이렉트
      navigate(`/auth/oauth2/callback${location.search}`, { replace: true });
    }
  };

  // 기존 세션 확인
  const checkExistingSession = async () => {
    if (isLoading || tooltip.show) {
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, LOGIN_SESSION_CHECK_DELAY));
      const isLoggedIn = await checkSession();
      
      if (isLoggedIn) {
        const user = sessionManager.getUser();
        if (user) {
          // 멀티 테넌트 사용자 확인
          await checkMultiTenantAndRedirect(user);
        }
      }
    } catch (error) {
      console.error('세션 확인 오류:', error);
    }
  };

  // 멀티 테넌트 사용자 확인 및 리다이렉트
  const checkMultiTenantAndRedirect = async (user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tenant/check-multi`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const responseData = await response.json();
        // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
        const data = (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData)
          ? responseData.data
          : responseData;
        if (data.success && data.isMultiTenant) {
          // 멀티 테넌트 사용자: 테넌트 선택 화면 표시
          await loadAccessibleTenants();
          setShowTenantSelection(true);
          return;
        }
      }
      
      // 단일 테넌트 또는 멀티 테넌트가 아닌 경우: redirect 파라미터 확인 후 리다이렉트
      const searchParams = new URLSearchParams(location.search);
      const redirectPath = searchParams.get('redirect');
      
      if (redirectPath) {
        // redirect 파라미터가 있으면 해당 경로로 이동
        navigate(redirectPath, { replace: true });
      } else {
        // redirect 파라미터가 없으면 동적 대시보드로 이동
      const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
      const authResponse = {
        user: user,
        isMultiTenant: false
      };
      await redirectToDynamicDashboard(authResponse, navigate);
      }
    } catch (error) {
      console.error('멀티 테넌트 확인 오류:', error);
      // 오류 시에도 redirect 파라미터 확인 후 리다이렉트
      const user = sessionManager.getUser();
      if (user) {
        const searchParams = new URLSearchParams(location.search);
        const redirectPath = searchParams.get('redirect');
        
        if (redirectPath) {
          // redirect 파라미터가 있으면 해당 경로로 이동
          navigate(redirectPath, { replace: true });
        } else {
          // redirect 파라미터가 없으면 동적 대시보드로 이동
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: user,
          isMultiTenant: false
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        }
      }
    }
  };

  // 접근 가능한 테넌트 목록 로드
  const loadAccessibleTenants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tenant/accessible`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccessibleTenants(data.tenants || []);
          setIsMultiTenant(data.isMultiTenant || false);
        }
      }
    } catch (error) {
      console.error('테넌트 목록 로드 오류:', error);
    }
  };

  // ID/PW 로그인 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showTooltip('이메일과 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 통합 로그인 요청:', formData);
      
      const result = await authAPI.login(formData);
      console.log('🔐 로그인 응답:', result);
      
      // ApiResponse 래퍼 처리: result.data 또는 result 직접 사용
      const loginData = result.data || result;
      
      if (result.success && loginData.user) {
        // sessionManager에 사용자 정보 설정 (세션 기반이므로 토큰 없음)
        sessionManager.setUser(loginData.user, {
          sessionId: loginData.sessionId
        });
        
        showTooltip('로그인에 성공했습니다.', 'success');
        
        // 백엔드에서 반환한 멀티 테넌트 정보 확인
        if (loginData.isMultiTenant && loginData.requiresTenantSelection && loginData.accessibleTenants) {
          // 멀티 테넌트 사용자: 테넌트 선택 화면 표시
          console.log('🔄 멀티 테넌트 사용자 감지:', loginData.accessibleTenants);
          setAccessibleTenants(loginData.accessibleTenants);
          setIsMultiTenant(true);
          setShowTenantSelection(true);
          setIsLoading(false);
          return;
        }
        
        // 단일 테넌트 사용자: redirect 파라미터 확인 후 리다이렉트
        const searchParams = new URLSearchParams(location.search);
        const redirectPath = searchParams.get('redirect');
        
        if (redirectPath) {
          // redirect 파라미터가 있으면 해당 경로로 이동
          navigate(redirectPath, { replace: true });
        } else {
          // redirect 파라미터가 없으면 동적 대시보드로 이동
        await new Promise(resolve => setTimeout(resolve, 300));
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        await redirectToDynamicDashboard(loginData, navigate);
        }
      } else if (loginData.requiresConfirmation || result.data?.requiresConfirmation) {
        // 중복 로그인 확인 요청
        setIsLoading(false);
        const modalData = {
          isOpen: true,
          message: (result.data?.message || result.message) || '다른 기기에서 로그인되어 있습니다. 계속하시겠습니까?',
          onConfirm: async () => {
            try {
              const confirmResult = await csrfTokenManager.post('/api/auth/confirm-duplicate-login', {
                email: formData.email,
                password: formData.password
              });
              const confirmResponse = await confirmResult.json();
              console.log('🔔 중복 로그인 확인 응답:', confirmResponse);
              
              // ApiResponse 래퍼 처리
              const confirmData = confirmResponse.data || confirmResponse;
              
              if (confirmResponse.success && confirmData.user) {
                sessionManager.setUser(confirmData.user, {
                  sessionId: confirmData.sessionId
                });
                
                // 백엔드에서 반환한 멀티 테넌트 정보 확인
                if (confirmData.isMultiTenant && confirmData.requiresTenantSelection && confirmData.accessibleTenants) {
                  // 멀티 테넌트 사용자: 테넌트 선택 화면 표시
                  console.log('🔄 멀티 테넌트 사용자 감지:', confirmData.accessibleTenants);
                  setAccessibleTenants(confirmData.accessibleTenants);
                  setIsMultiTenant(true);
                  setShowTenantSelection(true);
                  setIsLoading(false);
                  return;
                }
                
                // 단일 테넌트 사용자: redirect 파라미터 확인 후 리다이렉트
                const searchParams = new URLSearchParams(location.search);
                const redirectPath = searchParams.get('redirect');
                
                if (redirectPath) {
                  // redirect 파라미터가 있으면 해당 경로로 이동
                  navigate(redirectPath, { replace: true });
                } else {
                  // redirect 파라미터가 없으면 동적 대시보드로 이동
                await new Promise(resolve => setTimeout(resolve, 300));
                const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
                await redirectToDynamicDashboard(confirmData, navigate);
                }
              }
            } catch (error) {
              console.error('중복 로그인 확인 오류:', error);
              showTooltip('로그인 처리 중 오류가 발생했습니다.', 'error');
            }
          },
          onCancel: () => {
            setIsLoading(false);
          }
        };
        setDuplicateLoginModal(modalData);
      } else {
        console.log('❌ 로그인 실패:', result.message);
        setIsLoading(false);
        showTooltip('아이디 또는 비밀번호가 틀리니 다시 확인하시고 입력해주세요', 'error');
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      setIsLoading(false);
      showTooltip('아이디 또는 비밀번호가 틀리니 다시 한번 확인 부탁해요', 'error');
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

  // 테넌트 선택 완료 핸들러 (TenantSelection에서 직접 처리하도록 변경)
  const handleTenantSelected = async (tenantId) => {
    // TenantSelection 컴포넌트에서 직접 처리하므로 여기서는 호출만
    console.log('🔄 테넌트 선택 요청:', tenantId);
  };

  // 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    <CommonPageTemplate>
      <SimpleLayout>
        <div className="unified-login">
          <div className="unified-login__container">
            <div className="unified-login__header">
              <h1 className="unified-login__title">통합 로그인</h1>
              <p className="unified-login__subtitle">CoreSolution에 오신 것을 환영합니다</p>
            </div>

            {/* ID/PW 로그인 폼 */}
            <form onSubmit={handleSubmit} className="unified-login__form">
              <div className="unified-login__field">
                <label className="unified-login__label">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="unified-login__input"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="unified-login__field">
                <label className="unified-login__label">비밀번호</label>
                <div className="unified-login__password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="unified-login__input"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="unified-login__password-toggle"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {tooltip.show && (
                <div className={`unified-login__tooltip unified-login__tooltip--${tooltip.type}`}>
                  {tooltip.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="unified-login__submit-button"
              >
                {isLoading ? <UnifiedLoading /> : '로그인'}
              </button>
            </form>

            {/* 소셜 로그인 버튼 */}
            <div className="unified-login__social">
              <div className="unified-login__social-divider">
                <span>또는</span>
              </div>

              <div className="unified-login__social-buttons">
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  className="unified-login__social-button unified-login__social-button--kakao"
                >
                  <span className="unified-login__social-icon">카카오</span>
                  카카오로 로그인
                </button>

                <button
                  type="button"
                  onClick={handleNaverLogin}
                  className="unified-login__social-button unified-login__social-button--naver"
                >
                  <span className="unified-login__social-icon">네이버</span>
                  네이버로 로그인
                </button>

                {oauth2Config?.google && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="unified-login__social-button unified-login__social-button--google"
                  >
                    <span className="unified-login__social-icon">구글</span>
                    구글로 로그인
                  </button>
                )}
              </div>
            </div>

            {/* 추가 링크 */}
            <div className="unified-login__links">
              <a href="/register" className="unified-login__link">
                회원가입
              </a>
              <span className="unified-login__link-separator">|</span>
              <a href="/forgot-password" className="unified-login__link">
                비밀번호 찾기
              </a>
            </div>
          </div>
        </div>

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
      </SimpleLayout>
    </CommonPageTemplate>
  );
};

export default UnifiedLogin;

