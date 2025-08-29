import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification } from '../../utils/scripts';
import SocialSignupModal from './SocialSignupModal';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
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
        
        // 성공 메시지 표시
        notification.showToast(`${provider} 소셜 로그인에 성공했습니다!`, 'success');
        
        // 사용자 정보를 세션 스토리지에 저장 (필요한 경우)
        if (userId && email) {
          sessionStorage.setItem('oauth2_user', JSON.stringify({
            id: userId,
            email: email,
            name: name,
            nickname: nickname,
            role: role,
            profileImageUrl: profileImageUrl,
            provider: provider
          }));
        }
        
        // 잠시 후 대시보드로 이동
        setTimeout(() => {
          if (role) {
            const dashboardPath = `/${role.toLowerCase()}/dashboard`;
            navigate(dashboardPath);
          } else {
            // 기본 대시보드로 이동
            navigate('/dashboard');
          }
        }, 1500);
        
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
  
  // SocialSignupModal 렌더링
  if (showSignupModal && socialUserData) {
    return (
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
    );
  }
  
  return null;
};

export default OAuth2Callback;
