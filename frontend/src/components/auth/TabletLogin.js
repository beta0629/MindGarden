import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate, useLocation } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleLayout from '../layout/SimpleLayout';
import SocialSignupModal from './SocialSignupModal';
import DuplicateLoginModal from '../common/DuplicateLoginModal';
import { authAPI, testLogin } from '../../utils/ajax';
import { API_BASE_URL } from '../../constants/api';
import { kakaoLogin, naverLogin, handleOAuthCallback as socialHandleOAuthCallback } from '../../utils/socialLogin';
// import { setLoginSession, redirectToDashboard, logSessionInfo } from '../../utils/session'; // 제거됨
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { LOGIN_SESSION_CHECK_DELAY, EXISTING_SESSION_CHECK_DELAY } from '../../constants/session';
import { redirectToDynamicDashboard, getLegacyDashboardPath } from '../../utils/dashboardUtils';
import notificationManager from '../../utils/notification';
import { TABLET_LOGIN_CSS } from '../../constants/css';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { TABLET_LOGIN_CONSTANTS } from '../../constants/css-variables';
import '../../styles/auth/TabletLogin.css';

const TabletLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, testLogin: centralTestLogin, checkSession, setDuplicateLoginModal } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [oauth2Config, setOauth2Config] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialSignupModal, setShowSocialSignupModal] = useState(false);
  const [socialUserInfo, setSocialUserInfo] = useState(null);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  
  // SMS 로그인 상태
  const [smsMode, setSmsMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 간단한 툴팁 상태 (CSS 충돌 방지용)
  const [tooltip, setTooltip] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  // 전문적인 알림 표시 함수
  const showTooltip = (message, type = 'error') => {
    console.log('🔔 로그인 알림 표시:', { message, type });
    
    // 즉시 상태 업데이트
    setTooltip({ show: true, message, type });
    
    // 디버깅을 위한 추가 로그
    console.log('🔔 툴팁 상태 설정 완료:', { show: true, message, type });
    
    // 6초 후 자동 숨김 (더 길게)
    setTimeout(() => {
      console.log('🔔 툴팁 자동 숨김');
      setTooltip({ show: false, message: '', type: 'error' });
    }, 6000);
  };

  // 툴팁 상태 디버깅
  useEffect(() => {
    console.log('🔔 툴팁 상태 변경:', tooltip);
  }, [tooltip]);

  useEffect(() => {
    getOAuth2Config();
    checkOAuthCallback();
  }, [location]); // location 변경 시 OAuth 콜백 체크
  
  // 카운트다운 타이머 (별도 useEffect)
  useEffect(() => {
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

  // 세션이 있으면 대시보드로 리다이렉트 (로그인 시도 중이거나 알림 표시 중에는 제외)
  useEffect(() => {
    // 로그인 시도 중이거나 알림 표시 중에는 세션 확인 안 함
    if (isLoading || tooltip.show) {
      console.log('🚫 세션 확인 스킵: 로딩 중이거나 알림 표시 중');
      return;
    }

    const checkExistingSession = async () => {
      try {
        // ajax.js의 checkSessionAndRedirect를 우회하여 직접 세션 체크
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/current-user`, {
          credentials: 'include',
          method: 'GET'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.user) {
            console.log('✅ 기존 세션 발견, 대시보드로 리다이렉트:', result.user.role);
            
            // sessionManager에 사용자 정보 설정
            sessionManager.setUser(result.user, {
              accessToken: result.accessToken || 'existing_session_token',
              refreshToken: result.refreshToken || 'existing_session_refresh_token'
            });
            // SessionContext 동기화 (로그인 직후 공통코드 등에서 user 사용 가능하도록)
            await checkSession(true);

            // 동적 대시보드 라우팅
            const authResponse = {
              user: result.user,
              currentTenantRole: result.currentTenantRole || null
            };
            await redirectToDynamicDashboard(authResponse, navigate);
          }
        }
        // 401 등은 조용히 처리 (로그인 페이지 유지)
      } catch (error) {
        // 네트워크 오류 등은 무시
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
  }, [checkSession, navigate, isLoading, tooltip.show]);

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
      showTooltip('이메일과 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 로그인 요청 데이터:', formData);
      
      // 직접 API 호출 (SessionContext 로딩 상태 영향 방지)
      const result = await authAPI.login(formData);
      
      if (result.success) {
        
        // sessionManager에 사용자 정보 설정 (SessionContext 로딩 상태 영향 없이)
        sessionManager.setUser(result.user, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        // SessionContext 동기화 (로그인 직후 공통코드 등에서 user 사용 가능하도록)
        await checkSession(true);

        // 로그인 성공 알림
        showTooltip('로그인에 성공했습니다.', 'success');
        
        // 세션 설정 완료 후 잠시 대기 (시간 단축)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 공통 리다이렉션 함수 사용
        // 동적 대시보드 라우팅
        const authResponse = {
          user: result.user,
          currentTenantRole: result.currentTenantRole || null
        };
        await redirectToDynamicDashboard(authResponse, navigate);
      } else if (result.requiresConfirmation) {
        // 중복 로그인 확인 요청
        setIsLoading(false);
        
        // 중복 로그인 모달 표시
        const modalData = {
          isOpen: true,
          message: result.message || '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?',
          loginData: formData
        };
        
        setDuplicateLoginModal(modalData);
      } else {
        console.log('❌ 로그인 실패:', result.message);
        // 로딩 해제 후 알림 표시
        setIsLoading(false);
        // 메모리에 따라 로그인 실패 시 공통 메시지 사용
        setTimeout(() => {
          showTooltip('아이디 또는 비밀번호가 틀리니 다시 확인하시고 입력해주세요', 'error');
        }, 100); // 로딩 해제 후 알림 표시
        return; // finally 블록 실행 방지
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      console.error('❌ 오류 상세:', error.message);
      // 로딩 해제 후 알림 표시
      setIsLoading(false);
      // 공통 알림 시스템 사용 - 로그인 실패 시 공통 메시지
      setTimeout(() => {
        showTooltip('아이디 또는 비밀번호가 틀리니 다시 한번 확인 부탁해요', 'error');
      }, 100); // 로딩 해제 후 알림 표시
      return; // finally 블록 실행 방지
    } finally {
      // 성공한 경우에만 로딩 해제 (실패는 위에서 이미 처리)
      if (!tooltip.show) {
        setIsLoading(false);
      }
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
    const { SMS, VALIDATION, MESSAGES } = TABLET_LOGIN_CONSTANTS;
    
    if (!phoneNumber || phoneNumber.length !== SMS.PHONE_LENGTH) {
      showTooltip(MESSAGES.PHONE_INVALID, 'error');
      return;
    }

    if (!phoneNumber.match(VALIDATION.PHONE_REGEX)) {
      showTooltip(MESSAGES.PHONE_INVALID, 'error');
      return;
    }

    try {
      const response = await csrfTokenManager.post(TABLET_LOGIN_CONSTANTS.API_ENDPOINTS.SMS_SEND, { phoneNumber });

      const data = await response.json();

      if (data.success) {
        console.log('SMS 인증 코드 전송 성공:', data);
        setIsCodeSent(true);
        setCountdown(SMS.COUNTDOWN_DURATION);
        showTooltip(MESSAGES.SMS_SENT, 'success');
      } else {
        console.error('SMS 전송 실패:', data.message);
        showTooltip(data.message || MESSAGES.SMS_SEND_FAILED, 'error');
      }
    } catch (error) {
      console.error('SMS 전송 오류:', error);
      showTooltip(MESSAGES.SMS_SEND_FAILED, 'error');
    }
  };

  const verifyCode = async () => {
    const { SMS, VALIDATION, MESSAGES } = TABLET_LOGIN_CONSTANTS;
    
    if (!verificationCode || verificationCode.length !== SMS.CODE_LENGTH) {
      showTooltip(MESSAGES.CODE_INVALID, 'error');
      return;
    }

    if (!verificationCode.match(VALIDATION.PHONE_REGEX)) {
      showTooltip(MESSAGES.CODE_INVALID, 'error');
      return;
    }

    try {
      const response = await csrfTokenManager.post(TABLET_LOGIN_CONSTANTS.API_ENDPOINTS.SMS_VERIFY, { 
        phoneNumber, 
        verificationCode 
      });

      const data = await response.json();

      if (data.success) {
        console.log('SMS 인증 성공:', data);
        showTooltip(MESSAGES.SMS_VERIFY_SUCCESS, 'success');
        // 인증 성공 후 처리 - 로그인 완료 또는 다음 단계로 진행
        await handleSmsAuthSuccess();
      } else {
        console.error('SMS 인증 실패:', data.message);
        showTooltip(data.message || MESSAGES.SMS_VERIFY_FAILED, 'error');
      }
    } catch (error) {
      console.error('SMS 검증 오류:', error);
      showTooltip(MESSAGES.SMS_VERIFY_FAILED, 'error');
    }
  };

  // SMS 인증 성공 후 처리
  const handleSmsAuthSuccess = async () => {
    try {
      console.log('✅ SMS 인증 성공 후 로그인 처리 시작');
      
      // SMS 인증 성공 시 자동 로그인 처리
      // 전화번호로 사용자 조회 후 로그인
      const loginData = {
        phoneNumber: formData.phoneNumber,
        loginType: 'SMS_AUTH'
      };
      
      const response = await csrfTokenManager.post('/api/v1/auth/sms-login', loginData);
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ SMS 인증 로그인 성공:', data);
        showTooltip('SMS 인증 로그인에 성공했습니다.', 'success');
        
        // 로그인 성공 후 리다이렉트
        if (data.user) {
          // 사용자 정보 저장
          sessionStorage.setItem('user', JSON.stringify(data.user));
          sessionStorage.setItem('accessToken', data.accessToken);
          
          // 역할에 따른 리다이렉트
          const userRole = data.user.role;
          // 동적 대시보드 라우팅 (window.location 사용)
          try {
            const authResponse = {
              user: { role: userRole },
              currentTenantRole: null
            };
            // navigate가 없으므로 직접 경로 계산
            const legacyPath = getLegacyDashboardPath(userRole);
            window.location.href = legacyPath;
          } catch (error) {
            console.error('대시보드 리다이렉트 실패:', error);
            window.location.href = '/dashboard';
          }
        }
      } else {
        console.error('❌ SMS 인증 로그인 실패:', data.message);
        showTooltip(data.message || 'SMS 인증 로그인이 실패했습니다.', 'error');
        
        // 로그인 실패 시 회원가입 안내
        if (data.message && data.message.includes('회원가입')) {
          showTooltip('회원가입이 필요합니다. 회원가입을 진행해주세요.', 'info');
          // 회원가입 모달 표시 또는 회원가입 페이지로 이동
        }
      }
      
    } catch (error) {
      console.error('❌ SMS 인증 성공 후 처리 오류:', error);
      showTooltip('SMS 인증 후 로그인 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleKakaoLogin = async () => {
    await kakaoLogin();
  };

  const handleNaverLogin = async () => {
    await naverLogin();
  };


  const checkOAuthCallback = async () => {
    
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
        provider: (urlProvider || detectedProvider).toUpperCase(), // 대문자로 변환
        email: urlEmail || '',
        name: urlName || '',
        nickname: urlNickname || '',
        providerUserId: '',
        profileImageUrl: ''
      };
        
        console.log('👤 소셜 사용자 정보 설정:', socialUserInfo);
        
        // 알림 표시
        showTooltip(`${socialUserInfo.provider === 'KAKAO' ? '카카오' : '네이버'} 로그인: 간편 회원가입이 필요합니다.`, 'warning');
        
        setSocialUserInfo(socialUserInfo);
        setShowSocialSignupModal(true);
        
        console.log('📋 모달 상태 설정 완료 - showSocialSignupModal: true');
      } else {
        // 일반 에러는 토스트로만 표시
        showTooltip(decodedError, 'error');
      }
      
      // URL에서 에러 파라미터 제거
      window.history.replaceState({}, document.title, '/login');
      console.log('🧹 URL에서 에러 파라미터 제거됨');
      return;
    }
    
    // 간편 회원가입 필요 파라미터가 있으면 모달 표시
    if (signupRequired === 'required' && provider) {
      console.log('🔍 간편 회원가입 필요 감지 - signup=required 파라미터:', { signupRequired, provider });
      console.log('🎯 모달 표시 조건 충족 - signupRequired:', signupRequired, 'provider:', provider);
      
      const email = urlParams.get('email');
      const name = urlParams.get('name');
      const nickname = urlParams.get('nickname');
      
      console.log('📋 URL에서 파싱된 사용자 정보:', {
        email: email || '없음',
        name: name || '없음',
        nickname: nickname || '없음'
      });
      
      const socialUserInfo = {
        provider: provider.toUpperCase(), // 대문자로 변환
        email: email || '',
        name: name || '',
        nickname: nickname || '',
        providerUserId: '', // URL에서 전달할 수 없으므로 빈 값
        profileImageUrl: ''
      };
      
      console.log('👤 소셜 사용자 정보 설정:', socialUserInfo);
      
      // 알림 표시
      showTooltip(`${provider.toUpperCase() === 'KAKAO' ? '카카오' : '네이버'} 로그인: 간편 회원가입이 필요합니다.`, 'warning');
      
      console.log('📋 모달 상태 설정 시작 - socialUserInfo:', socialUserInfo);
      setSocialUserInfo(socialUserInfo);
      setShowSocialSignupModal(true);
      
      console.log('📋 모달 상태 설정 완료 - showSocialSignupModal: true');
      console.log('📋 현재 상태 확인:', { 
        showSocialSignupModal: true, 
        socialUserInfo: socialUserInfo 
      });
      
      // URL에서 파라미터 제거 (모달이 표시된 후에 제거)
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/login');
      }, 100);
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
        
        showTooltip(errorMessage, 'error');
        
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
        // 동적 대시보드 라우팅
        const authResponse = {
          user: response.userInfo,
          currentTenantRole: response.currentTenantRole || null
        };
        console.log('✅ 간편 회원가입 성공, 동적 대시보드로 이동');
        await redirectToDynamicDashboard(authResponse, navigate);
      } else {
        console.log('❌ 간편 회원가입 - 세션 설정 실패');
        notificationManager.show('세션 설정에 실패했습니다.', 'info');
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
    
    // 햄버거 메뉴 상태 토글
    setIsHamburgerMenuOpen(prev => !prev);
    
    // 햄버거 메뉴 애니메이션 효과
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    if (hamburgerIcon) {
      hamburgerIcon.classList.toggle('active');
    }
    
    // 메뉴 항목들에 대한 접근성 처리
    const menuItems = document.querySelectorAll('.hamburger-menu-item');
    menuItems.forEach(item => {
      if (isHamburgerMenuOpen) {
        item.setAttribute('tabindex', '-1');
        item.setAttribute('aria-hidden', 'true');
      } else {
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-hidden', 'false');
      }
    });
  };

  const handleProfileClick = () => {
    console.log('👤 프로필 클릭');
    
    // 로그인 상태 확인
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    
    if (user) {
      // 로그인된 사용자의 경우 프로필 페이지로 이동
      const userRole = user.role;
      let profileUrl = '/profile';
      
      // 역할에 따른 프로필 페이지 설정
      switch (userRole) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          profileUrl = '/admin/profile';
          break;
        case 'CONSULTANT':
          profileUrl = '/consultant/profile';
          break;
        case 'CLIENT':
          profileUrl = '/client/profile';
          break;
        default:
          profileUrl = '/profile';
      }
      
      console.log(`👤 프로필 페이지로 이동: ${profileUrl}`);
      window.location.href = profileUrl;
      
    } else {
      // 로그인되지 않은 사용자의 경우 로그인 페이지로 이동
      console.log('👤 로그인되지 않은 사용자 - 로그인 페이지로 이동');
      showTooltip('로그인이 필요합니다.', 'info');
      
      // 현재 페이지가 이미 로그인 페이지인지 확인
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className={TABLET_LOGIN_CSS.CONTAINER}>
      <div className={TABLET_LOGIN_CSS.CONTENT}>
          <div className={TABLET_LOGIN_CSS.HEADER}>
            <h1 className={TABLET_LOGIN_CSS.TITLE}>Core Solution 로그인</h1>
            <p className={TABLET_LOGIN_CSS.SUBTITLE}>Core Solution에 오신 것을 환영합니다</p>
          </div>

          <div className={TABLET_LOGIN_CSS.MODE_SWITCH}>
            <button 
              className={`${TABLET_LOGIN_CSS.MODE_BUTTON} ${!smsMode ? TABLET_LOGIN_CSS.MODE_ACTIVE : ''}`}
              onClick={() => setSmsMode(false)}
            >
              <i className="bi bi-envelope"></i>
              이메일 로그인
            </button>
            <button 
              className={`${TABLET_LOGIN_CSS.MODE_BUTTON} ${smsMode ? TABLET_LOGIN_CSS.MODE_ACTIVE : ''}`}
              onClick={() => setSmsMode(true)}
            >
              <i className="bi bi-phone"></i>
              SMS 로그인
            </button>
          </div>

          {!smsMode ? (
            /* 이메일 로그인 폼 */
            <form className={TABLET_LOGIN_CSS.FORM} onSubmit={handleSubmit}>
              <div className={TABLET_LOGIN_CSS.FORM_GROUP}>
                <label className={TABLET_LOGIN_CSS.LABEL}>
                  <i className="bi bi-envelope"></i>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={TABLET_LOGIN_CSS.INPUT}
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className={TABLET_LOGIN_CSS.FORM_GROUP}>
                <label className={TABLET_LOGIN_CSS.LABEL}>
                  <i className="bi bi-lock"></i>
                  비밀번호
                </label>
                <div className={TABLET_LOGIN_CSS.INPUT_GROUP}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={TABLET_LOGIN_CSS.INPUT}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    className={TABLET_LOGIN_CSS.PASSWORD_TOGGLE}
                    onClick={togglePassword}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`${TABLET_LOGIN_CSS.BUTTON} ${TABLET_LOGIN_CSS.BUTTON_PRIMARY}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={TABLET_LOGIN_CSS.LOADING}></span>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
              
              {/* 비밀번호 찾기 링크 */}
              <div className="tablet-login-forgot-password">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="tablet-login-forgot-password-btn"
                  onMouseEnter={(e) => {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #5a67d8 -> var(--mg-custom-5a67d8)
                    e.target.style.color = '#5a67d8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--mg-primary-500)';
                  }}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </form>
          ) : (
            /* SMS 로그인 폼 */
            <div className={TABLET_LOGIN_CSS.SMS_SECTION}>
              <div className={TABLET_LOGIN_CSS.FORM_GROUP}>
                <label className={TABLET_LOGIN_CSS.LABEL}>
                  <i className="bi bi-phone"></i>
                  휴대폰 번호
                </label>
                <div className={TABLET_LOGIN_CSS.INPUT_GROUP}>
                  <input
                    type="tel"
                    value={formatPhoneNumber(phoneNumber)}
                    onChange={handlePhoneChange}
                    className={TABLET_LOGIN_CSS.INPUT}
                    placeholder="010-0000-0000"
                    maxLength="13"
                  />
                  <button
                    type="button"
                    className={TABLET_LOGIN_CSS.SMS_BUTTON}
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
                <div className={TABLET_LOGIN_CSS.FORM_GROUP}>
                  <label className={TABLET_LOGIN_CSS.LABEL}>
                    <i className="bi bi-shield-check"></i>
                    인증 코드
                  </label>
                  <div className={TABLET_LOGIN_CSS.SMS_VERIFICATION}>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className={TABLET_LOGIN_CSS.VERIFICATION_INPUT}
                      placeholder="6자리 인증 코드"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      className={TABLET_LOGIN_CSS.VERIFICATION_BUTTON}
                      onClick={verifyCode}
                    >
                      인증
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`${TABLET_LOGIN_CSS.BUTTON} ${TABLET_LOGIN_CSS.BUTTON_SECONDARY}`}
                disabled={!isCodeSent || !verificationCode}
              >
                SMS 로그인
              </button>
            </div>
          )}

          <div className={TABLET_LOGIN_CSS.DIVIDER}>
            <span>또는</span>
          </div>

          <div className={TABLET_LOGIN_CSS.SOCIAL_BUTTONS}>
            <button
              className={`${TABLET_LOGIN_CSS.SOCIAL_BUTTON} kakao`}
              onClick={handleKakaoLogin}
              disabled={!oauth2Config?.kakao}
            >
              <i className="bi bi-chat-dots"></i>
              카카오로 로그인
            </button>
            <button
              className={`${TABLET_LOGIN_CSS.SOCIAL_BUTTON} naver`}
              onClick={handleNaverLogin}
              disabled={!oauth2Config?.naver}
            >
              <i className="bi bi-n"></i>
              네이버로 로그인
            </button>
          </div>

          <div className={TABLET_LOGIN_CSS.FOOTER}>
            <p className="register-link">
              계정이 없으신가요?{' '}
              <button
                type="button"
                className={TABLET_LOGIN_CSS.FOOTER_LINK}
                onClick={() => navigate('/register')}
              >
                회원가입
              </button>
            </p>
          </div>
        </div>

      {console.log('🔍 SocialSignupModal 렌더링 체크:', { 
        showSocialSignupModal, 
        socialUserInfo,
        isOpen: showSocialSignupModal 
      })}
      <SocialSignupModal
        isOpen={showSocialSignupModal}
        onClose={() => {
          console.log('📋 모달 닫기 버튼 클릭');
          setShowSocialSignupModal(false);
        }}
        socialUser={socialUserInfo}
        onSignupSuccess={handleSocialSignupSuccess}
      />

      {/* 중복 로그인 모달 */}
      <DuplicateLoginModal />

      {/* 전문적인 로그인 알림 (CSS 충돌 방지용) */}
      {tooltip.show && (
        <>
          <style>{`
            @keyframes loginNotificationSlideIn {
              from { 
                transform: translate(-50%, -60%) scale(0.8);
                opacity: 0;
              }
              to { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
            }
            @keyframes loginNotificationPulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.02); }
            }
          `}</style>
          <div
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--mg-white)',
              color: 'var(--mg-gray-800)',
              padding: '28px 56px',
              borderRadius: '12px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.08) -> var(--mg-custom-color)
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              zIndex: 10001,
              fontSize: 'var(--font-size-md)',
              fontWeight: '400',
              fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif",
              width: '520px',
              maxWidth: '85vw',
              textAlign: 'center',
              cursor: 'pointer',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
              border: '1px solid #e9ecef',
              animation: 'loginNotificationSlideIn 0.4s ease-out'
            }}
            onClick={() => setTooltip({ show: false, message: '', type: 'error' })}
          >
            
            
            {/* 메시지 */}
            <div style={{ 
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              marginBottom: '8px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
              color: '#495057',
              lineHeight: '1.5',
              letterSpacing: '0.2px'
            }}>
              {tooltip.message}
            </div>
            
            {/* 닫기 안내 */}
            <div style={{ 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--mg-secondary-500)',
              fontWeight: '400',
              opacity: 0.8,
              marginTop: '12px'
            }}>
              터치하여 닫기
            </div>
          </div>
          
          {/* 배경 오버레이 */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--mg-shadow-light)',
              zIndex: 10000,
              backdropFilter: 'blur(0.5px)'
            }}
            onClick={() => setTooltip({ show: false, message: '', type: 'error' })}
          />
        </>
      )}
    </div>
  );
};

// 간단한 툴팁 전용 (CSS 충돌 완전 방지)

export default TabletLogin;
