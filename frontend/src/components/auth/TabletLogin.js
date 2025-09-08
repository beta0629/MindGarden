import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleHeader from '../layout/SimpleHeader';
import SocialSignupModal from './SocialSignupModal';
import { authAPI } from '../../utils/ajax';
import { testLogin } from '../../utils/ajax';
import { kakaoLogin, naverLogin, handleOAuthCallback as socialHandleOAuthCallback } from '../../utils/socialLogin';
// import { setLoginSession, redirectToDashboard, logSessionInfo } from '../../utils/session'; // 제거됨
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { LOGIN_SESSION_CHECK_DELAY, EXISTING_SESSION_CHECK_DELAY } from '../../constants/session';
import notificationManager from '../../utils/notification';

const TabletLogin = () => {
  const navigate = useNavigate();
  const { login, testLogin: centralTestLogin, checkSession } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [oauth2Config, setOauth2Config] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialSignupModal, setShowSocialSignupModal] = useState(false);
  const [socialUserInfo, setSocialUserInfo] = useState(null);
  
  // SMS 로그인 상태
  const [smsMode, setSmsMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    getOAuth2Config();
    checkOAuthCallback();
    
    // 카운트다운 타이머
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // 세션이 있으면 대시보드로 리다이렉트
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 로그인 페이지 - 기존 세션 확인 중...');
        const isLoggedIn = await checkSession();
        
        if (isLoggedIn) {
          const user = sessionManager.getUser();
          if (user && user.role) {
            const dashboardPath = `/${user.role.toLowerCase()}/dashboard`;
            console.log('✅ 기존 세션 발견, 대시보드로 리다이렉트:', dashboardPath);
            console.log('👤 사용자 정보:', user);
            navigate(dashboardPath, { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ 세션 확인 실패:', error);
      }
    };

    // 컴포넌트 마운트 완료 후 세션 확인
    if (EXISTING_SESSION_CHECK_DELAY > 0) {
      const timer = setTimeout(checkExistingSession, EXISTING_SESSION_CHECK_DELAY);
      return () => clearTimeout(timer);
    } else {
      // 즉시 실행
      checkExistingSession();
    }
  }, [checkSession, navigate]);

  const getOAuth2Config = async () => {
    try {
      const config = await authAPI.getOAuth2Config();
      setOauth2Config(config);
    } catch (error) {
      console.error('OAuth2 설정 로드 실패:', error);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      notificationManager.show('이메일과 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 로그인 요청 데이터:', formData);
      
      // 중앙 세션의 로그인 함수 사용 (API 호출 포함)
      const result = await login(formData);
      
      if (result.success) {
        console.log('✅ 로그인 성공:', result.user);
        
        // 로그인 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 세션 설정 완료 후 잠시 대기 (시간 단축)
        console.log('⏳ 세션 설정 완료, 잠시 대기...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 역할에 따른 대시보드로 리다이렉트
        const dashboardPath = `/${result.user.role.toLowerCase()}/dashboard`;
        console.log('✅ 로그인 성공, 대시보드로 이동:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      } else {
        console.log('❌ 로그인 실패:', result.message);
        notificationManager.show(result.message, 'error');
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      console.error('❌ 오류 상세:', error.message);
      // 공통 알림 시스템 사용
      notificationManager.show(`로그인 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS 로그인 관련 함수들
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      alert('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 SMS 인증 코드 전송 API 호출
      console.log('SMS 인증 코드 전송:', phoneNumber);
      setIsCodeSent(true);
      setCountdown(180); // 3분 카운트다운
      alert('인증 코드가 전송되었습니다.');
    } catch (error) {
      console.error('SMS 전송 오류:', error);
      alert('인증 코드 전송에 실패했습니다.');
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('6자리 인증 코드를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 SMS 인증 코드 검증 API 호출
      console.log('SMS 인증 코드 검증:', verificationCode);
      alert('인증이 완료되었습니다.');
      // 인증 성공 후 처리
    } catch (error) {
      console.error('SMS 검증 오류:', error);
      alert('인증 코드가 올바르지 않습니다.');
    }
  };

  const handleKakaoLogin = async () => {
    await kakaoLogin();
  };

  const handleNaverLogin = async () => {
    await naverLogin();
  };

  const handleTestLogin = async () => {
    try {
      setIsLoading(true);
      const response = await testLogin();
      if (response.success) {
        console.log('테스트 로그인 성공:', response);
        
        // 중앙 세션의 테스트 로그인 함수 사용
        console.log('🔄 테스트 로그인 - 중앙 세션 설정 시작...');
        const loginSuccess = await centralTestLogin(response.user, {
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token'
        });
        
        if (loginSuccess) {
          // 테스트 로그인 성공 알림
          notificationManager.show('테스트 로그인에 성공했습니다.', 'success');
          
          // 세션 설정 완료 후 잠시 대기
          console.log('⏳ 테스트 로그인 - 세션 설정 완료, 잠시 대기...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 역할에 따른 대시보드로 리다이렉트
          const dashboardPath = `/${response.user.role.toLowerCase()}/dashboard`;
          console.log('✅ 테스트 로그인 성공, 대시보드로 이동:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        } else {
          console.log('❌ 테스트 로그인 - 세션 설정 실패');
          notificationManager.show('세션 설정에 실패했습니다.', 'error');
        }
      } else {
        notificationManager.show(response.message || '테스트 로그인에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('테스트 로그인 오류:', error);
      notificationManager.show('테스트 로그인 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOAuthCallback = async () => {
    console.log('🔍 checkOAuthCallback 함수 실행됨');
    console.log('📍 현재 URL:', window.location.href);
    console.log('🔗 URL 검색 파라미터:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = urlParams.get('provider');
    const signupRequired = urlParams.get('signup');
    const error = urlParams.get('error');
    
    console.log('📋 파싱된 URL 파라미터:', {
      code: code ? '있음' : '없음',
      state: state ? '있음' : '없음',
      provider: provider || '없음',
      signupRequired: signupRequired || '없음',
      error: error ? '있음' : '없음'
    });
    
    // 에러 파라미터가 있으면 사용자에게 표시
    if (error) {
      console.log('❌ 에러 파라미터 감지:', error);
      const decodedError = decodeURIComponent(error);
      console.log('🔤 디코딩된 에러 메시지:', decodedError);
      
      // 에러 메시지에 "간편 회원가입이 필요합니다"가 포함되어 있으면 모달 표시
      if (decodedError.includes('간편 회원가입이 필요합니다')) {
        console.log('🔍 간편 회원가입 필요 감지 - 에러 메시지에서');
        
        // URL에서 사용자 정보 파싱
        const urlProvider = urlParams.get('provider');
        const urlEmail = urlParams.get('email');
        const urlName = urlParams.get('name');
        const urlNickname = urlParams.get('nickname');
        
        console.log('📋 URL에서 파싱된 사용자 정보:', {
          provider: urlProvider,
          email: urlEmail,
          name: urlName,
          nickname: urlNickname
        });
        
        // 카카오 또는 네이버로 추정 (에러 메시지에서 판단)
        const detectedProvider = decodedError.includes('카카오') ? 'kakao' : 'naver';
        
        const socialUserInfo = {
          provider: urlProvider || detectedProvider,
          email: urlEmail || '',
          name: urlName || '',
          nickname: urlNickname || '',
          providerUserId: '',
          profileImageUrl: ''
        };
        
        console.log('👤 소셜 사용자 정보 설정:', socialUserInfo);
        
        // 알림 표시
        notificationManager.show(`${socialUserInfo.provider === 'kakao' ? '카카오' : '네이버'} 로그인: 간편 회원가입이 필요합니다.`, 'warning');
        
        setSocialUserInfo(socialUserInfo);
        setShowSocialSignupModal(true);
        
        console.log('📋 모달 상태 설정 완료 - showSocialSignupModal: true');
      } else {
        // 일반 에러는 토스트로만 표시
        notificationManager.show(decodedError, 'error');
      }
      
      // URL에서 에러 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
      console.log('🧹 URL에서 에러 파라미터 제거됨');
      return;
    }
    
    // 간편 회원가입 필요 파라미터가 있으면 모달 표시
    if (signupRequired === 'required' && provider) {
      console.log('🔍 간편 회원가입 필요 감지 - signup=required 파라미터:', { signupRequired, provider });
      
      const email = urlParams.get('email');
      const name = urlParams.get('name');
      const nickname = urlParams.get('nickname');
      
      console.log('📋 URL에서 파싱된 사용자 정보:', {
        email: email || '없음',
        name: name || '없음',
        nickname: nickname || '없음'
      });
      
      const socialUserInfo = {
        provider: provider,
        email: email || '',
        name: name || '',
        nickname: nickname || '',
        providerUserId: '', // URL에서 전달할 수 없으므로 빈 값
        profileImageUrl: ''
      };
      
      console.log('👤 소셜 사용자 정보 설정:', socialUserInfo);
      
      // 알림 표시
      notificationManager.show(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인: 간편 회원가입이 필요합니다.`, 'warning');
      
      setSocialUserInfo(socialUserInfo);
      setShowSocialSignupModal(true);
      
      console.log('📋 모달 상태 설정 완료 - showSocialSignupModal: true');
      
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
      return;
    }
    
    // OAuth2 콜백 처리
    if (code && state && provider) {
      try {
        const result = await socialHandleOAuthCallback(provider, code, state);
        if (result?.requiresSignup) {
          setSocialUserInfo(result.socialUserInfo);
          setShowSocialSignupModal(true);
          window.history.replaceState({}, document.title, '/login');
        }
      } catch (error) {
        console.error('OAuth2 콜백 처리 오류:', error);
        
        // 에러 메시지를 사용자에게 표시
        let errorMessage = '소셜 로그인 처리 중 오류가 발생했습니다.';
        
        if (error.message.includes('state 검증 실패')) {
          errorMessage = '보안 검증에 실패했습니다. 다시 시도해주세요.';
        } else if (error.message.includes('세션 설정')) {
          errorMessage = '로그인 세션 설정에 실패했습니다. 다시 시도해주세요.';
        } else if (error.message.includes('OAuth2 인증 실패')) {
          errorMessage = '소셜 인증에 실패했습니다. 다시 시도해주세요.';
        }
        
        notificationManager.show(errorMessage, 'error');
        
        // URL에서 OAuth2 파라미터 제거
        window.history.replaceState({}, document.title, '/login');
      }
    }
  };

  const handleSocialSignupSuccess = async (response) => {
    setShowSocialSignupModal(false);
    setSocialUserInfo(null);
    console.log('간편 회원가입 성공:', response.message);
    
    // 회원가입 성공 후 대시보드로 리다이렉트
    if (response.userInfo) {
      // 세션 설정
      // 중앙 세션에 사용자 정보 설정
      console.log('🔄 간편 회원가입 - 중앙 세션 설정 시작...');
      const loginSuccess = await login(response.userInfo, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      
      if (loginSuccess) {
        // 세션 설정 완료 후 잠시 대기
        console.log('⏳ 간편 회원가입 - 세션 설정 완료, 잠시 대기...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 역할에 따른 대시보드로 리다이렉트
        const dashboardPath = `/${response.userInfo.role.toLowerCase()}/dashboard`;
        console.log('✅ 간편 회원가입 성공, 대시보드로 이동:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      } else {
        console.log('❌ 간편 회원가입 - 세션 설정 실패');
        alert('세션 설정에 실패했습니다.');
      }
    } else {
      // 사용자 정보가 없으면 새로고침
      window.location.reload();
    }
  };

  const toggleLoginMode = () => {
    setSmsMode(!smsMode);
    setFormData({ email: '', password: '' });
    setPhoneNumber('');
    setVerificationCode('');
    setIsCodeSent(false);
    setCountdown(0);
  };

  const handleHamburgerToggle = () => {
    console.log('🍔 햄버거 메뉴 토글');
    // TODO: 햄버거 메뉴 로직 구현
  };

  const handleProfileClick = () => {
    console.log('👤 프로필 클릭');
    // TODO: 프로필 페이지로 이동
  };

  return (
    <CommonPageTemplate 
      title="MindGarden - 로그인"
      description="MindGarden 계정으로 로그인하여 상담 서비스를 이용하세요"
      bodyClass="tablet-page"
    >
      <div className="tablet-login-page tablet-page">
        {/* 공통 헤더 */}
        <SimpleHeader />
        
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">MindGarden 로그인</h1>
            <p className="login-subtitle">마음의 정원에 오신 것을 환영합니다</p>
          </div>

          <div className="login-tabs">
            <button 
              className={`login-tab ${!smsMode ? 'active' : ''}`}
              onClick={() => setSmsMode(false)}
            >
              <i className="bi bi-envelope"></i>
              이메일 로그인
            </button>
            <button 
              className={`login-tab ${smsMode ? 'active' : ''}`}
              onClick={() => setSmsMode(true)}
            >
              <i className="bi bi-phone"></i>
              SMS 로그인
            </button>
          </div>

          {!smsMode ? (
            /* 이메일 로그인 폼 */
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-envelope"></i>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-lock"></i>
                  비밀번호
                </label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePassword}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-button primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>
          ) : (
            /* SMS 로그인 폼 */
            <div className="sms-login-form">
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-phone"></i>
                  휴대폰 번호
                </label>
                <div className="phone-input-group">
                  <input
                    type="tel"
                    value={formatPhoneNumber(phoneNumber)}
                    onChange={handlePhoneChange}
                    className="form-input"
                    placeholder="010-0000-0000"
                    maxLength="13"
                  />
                  <button
                    type="button"
                    className="send-code-button"
                    onClick={sendVerificationCode}
                    disabled={isCodeSent && countdown > 0}
                  >
                    {isCodeSent && countdown > 0 
                      ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
                      : '인증번호 전송'
                    }
                  </button>
                </div>
              </div>

              {isCodeSent && (
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-shield-check"></i>
                    인증 코드
                  </label>
                  <div className="verification-input-group">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="form-input"
                      placeholder="6자리 인증 코드"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      className="verify-code-button"
                      onClick={verifyCode}
                    >
                      인증
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="login-button secondary"
                disabled={!isCodeSent || !verificationCode}
              >
                SMS 로그인
              </button>
            </div>
          )}

          <div className="login-divider">
            <span>또는</span>
          </div>

          <div className="social-login-buttons">
            <button
              className="social-login-button kakao"
              onClick={handleKakaoLogin}
              disabled={!oauth2Config?.kakao}
            >
              <i className="bi bi-chat-dots"></i>
              카카오로 로그인
            </button>
            <button
              className="social-login-button naver"
              onClick={handleNaverLogin}
              disabled={!oauth2Config?.naver}
            >
              <i className="bi bi-n"></i>
              네이버로 로그인
            </button>
          </div>

          <div className="login-footer">
            <p className="register-link">
              계정이 없으신가요?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/register')}
              >
                회원가입
              </button>
            </p>
            <p className="forgot-password">
              <button
                type="button"
                className="link-button"
                onClick={() => alert('비밀번호 찾기 기능은 준비 중입니다.')}
              >
                비밀번호를 잊으셨나요?
              </button>
            </p>
            {/* 테스트 로그인 버튼 (개발 환경에서만 표시) */}
            <p className="test-login">
              <button
                type="button"
                className="link-button test-button"
                onClick={handleTestLogin}
                disabled={isLoading}
              >
                {isLoading ? '테스트 로그인 중...' : '테스트 로그인'}
              </button>
            </p>
          </div>
        </div>

        <SocialSignupModal
          isOpen={showSocialSignupModal}
          onClose={() => {
            console.log('📋 모달 닫기 버튼 클릭');
            setShowSocialSignupModal(false);
          }}
          socialUser={socialUserInfo}
          onSignupSuccess={handleSocialSignupSuccess}
        />
      </div>
    </CommonPageTemplate>
  );
};

export default TabletLogin;
