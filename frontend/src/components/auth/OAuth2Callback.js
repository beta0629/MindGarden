import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification } from '../../utils/scripts';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { LOGIN_SESSION_CHECK_DELAY } from '../../constants/session';
import SocialSignupModal from './SocialSignupModal';
import AccountIntegrationModal from './AccountIntegrationModal';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, checkSession } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [socialUserData, setSocialUserData] = useState(null);

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        console.log('🔄 OAuth2 콜백 처리 시작');
        
        // URL 파라미터에서 정보 추출
        const searchParams = new URLSearchParams(location.search);
        const success = searchParams.get('success');
        const provider = searchParams.get('provider');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const nickname = searchParams.get('nickname');
        const role = searchParams.get('role');
        const requiresAccountIntegration = searchParams.get('requiresAccountIntegration');
        const profileImageUrl = searchParams.get('profileImageUrl');
        const providerUserId = searchParams.get('providerUserId'); // 추가: SNS 사용자 ID
        const error = searchParams.get('error');
        const requiresSignup = searchParams.get('requiresSignup');
        
        console.log('📋 OAuth2 콜백 파라미터:', { 
          success, provider, userId, email, name, nickname, role, profileImageUrl, providerUserId, error, requiresSignup
        });
        
        if (error) {
          console.error('❌ OAuth2 오류:', error);
          setError(`OAuth2 인증 오류: ${error}`);
          notification.showToast('OAuth2 인증에 실패했습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!success || success !== 'true') {
          console.error('❌ OAuth2 성공 플래그가 없습니다');
          setError('OAuth2 인증이 완료되지 않았습니다.');
          notification.showToast('OAuth2 인증이 완료되지 않았습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!provider) {
          console.error('❌ Provider 정보가 없습니다');
          setError('OAuth2 제공자 정보를 찾을 수 없습니다.');
          notification.showToast('OAuth2 제공자 정보를 찾을 수 없습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // 계정 통합이 필요한 경우
        if (requiresAccountIntegration === 'true') {
          console.log('🔗 OAuth2 계정 통합 필요:', { provider, email, name, nickname });
          
          // 성공 메시지 표시
          notification.showToast(`${provider} 소셜 로그인 성공! 기존 계정과 연결해주세요.`, 'success');
          
          // SNS 사용자 정보 설정
          const userData = {
            provider: provider,
            providerUserId: providerUserId,
            email: email,
            name: name,
            nickname: nickname,
            profileImageUrl: profileImageUrl
          };
          
          setSocialUserData(userData);
          setShowIntegrationModal(true);
          setIsProcessing(false);
          
          return;
        }
        
        // 회원가입이 필요한 경우
        if (requiresSignup === 'true') {
          console.log('📝 OAuth2 회원가입 필요:', { provider, email, name, nickname });
          
          // 성공 메시지 표시
          notification.showToast(`${provider} 소셜 로그인 성공! 회원가입을 완료해주세요.`, 'success');
          
          // SNS 사용자 정보 설정
          const userData = {
            provider: provider,
            providerUserId: providerUserId, // 추가: SNS 사용자 ID
            email: email,
            name: name,
            nickname: nickname,
            profileImageUrl: profileImageUrl
          };
          
          setSocialUserData(userData);
          setShowSignupModal(true);
          setIsProcessing(false);
          
          return;
        }
        
        // 성공적인 OAuth2 로그인 처리 (기존 사용자)
        console.log('✅ OAuth2 로그인 성공:', { provider, userId, email, name, nickname, role });
        console.log('🔍 OAuth2 콜백 URL 파라미터:', { userId, email, name, nickname, role, provider });
        
        // 성공 메시지 표시
        notification.showToast(`${provider} 소셜 로그인에 성공했습니다!`, 'success');
        
        // 사용자 정보를 중앙 세션에 설정
        if (userId && email) {
          const userInfo = {
            id: parseInt(userId),
            email: email,
            name: name,
            nickname: nickname,
            role: role,
            profileImageUrl: profileImageUrl,
            provider: provider
          };
          
          // 중앙 세션에 사용자 정보 설정
          const loginSuccess = await login(userInfo, {
            accessToken: 'oauth2_token',
            refreshToken: 'oauth2_refresh_token'
          });
          console.log('✅ OAuth2 중앙 세션에 사용자 정보 설정:', userInfo);
          
          // 리다이렉트 함수 정의
          const redirectToDashboard = (userRole) => {
            if (userRole) {
              const dashboardPath = `/${userRole.toLowerCase()}/dashboard`;
              console.log('🎯 대시보드 리다이렉트 시작:', dashboardPath);
              console.log('🎯 사용자 정보:', userInfo);
              console.log('🎯 역할:', userRole);
              
              // 1차: React Router navigate
              try {
                navigate(dashboardPath, { replace: true });
                console.log('✅ React Router navigate 실행됨');
              } catch (error) {
                console.error('❌ React Router navigate 실패:', error);
              }
              
              // 2차: window.location (즉시 실행)
              setTimeout(() => {
                console.log('🎯 window.location 리다이렉트 실행:', dashboardPath);
                window.location.href = dashboardPath;
              }, 100);
              
              // 3차: 강제 리다이렉트 (최종 백업)
              setTimeout(() => {
                console.log('🎯 강제 리다이렉트 실행:', dashboardPath);
                window.location.replace(dashboardPath);
              }, 1000);
            } else {
              console.log('🎯 기본 대시보드로 리다이렉트');
              navigate('/dashboard', { replace: true });
            }
          };

          if (loginSuccess) {
            console.log('✅ 중앙 세션 로그인 성공, 대시보드로 리다이렉트 시작');
            redirectToDashboard(role);
          } else {
            console.error('❌ OAuth2 중앙 세션 로그인 실패, 재시도...');
            // 로그인 실패 시 추가 시도
            setTimeout(async () => {
              try {
                console.log('🔄 OAuth2 세션 재확인 시도...');
                const isLoggedIn = await checkSession(true);
                if (isLoggedIn && role) {
                  console.log('✅ 세션 재확인 성공, 대시보드로 리다이렉트');
                  redirectToDashboard(role);
                } else {
                  console.error('❌ 세션 재확인 실패, 강제 리다이렉트 시도');
                  redirectToDashboard(role);
                }
              } catch (error) {
                console.error('❌ OAuth2 세션 재확인 실패:', error);
                // 에러가 발생해도 강제 리다이렉트 시도
                redirectToDashboard(role);
              }
            }, 500);
          }
          
          // 세션 스토리지에도 저장 (백업)
          sessionStorage.setItem('oauth2_user', JSON.stringify(userInfo));
        }
        
      } catch (error) {
        console.error('❌ OAuth2 콜백 처리 오류:', error);
        setError(error.message);
        notification.showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
        
        // 오류 발생 시 로그인 페이지로 이동
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleOAuth2Callback();
  }, [navigate, location]);
  
  if (isProcessing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>
          🔄 로그인 처리 중...
        </div>
        <div style={{ fontSize: '16px', color: '#666' }}>
          잠시만 기다려주세요.
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px', color: '#e74c3c' }}>
          ❌ 로그인 실패
        </div>
        <div style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
          {error}
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          잠시 후 로그인 페이지로 이동합니다...
        </div>
      </div>
    );
  }
  
  // SocialSignupModal 또는 AccountIntegrationModal 렌더링
  if ((showSignupModal || showIntegrationModal) && socialUserData) {
    return (
      <>
        <SocialSignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          socialUser={socialUserData}
          onSignupSuccess={(response) => {
            console.log('✅ 소셜 회원가입 성공:', response);
            notification.showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
            // 로그인 페이지로 이동
            navigate('/login');
          }}
        />
        
        <AccountIntegrationModal
          isOpen={showIntegrationModal}
          onClose={() => setShowIntegrationModal(false)}
          socialUserInfo={socialUserData}
          onIntegrationSuccess={(response) => {
            console.log('계정 통합 성공:', response);
            setShowIntegrationModal(false);
            // 통합 성공 후 대시보드로 이동
            navigate('/dashboard');
          }}
        />
      </>
    );
  }
  
  return null;
};

export default OAuth2Callback;
