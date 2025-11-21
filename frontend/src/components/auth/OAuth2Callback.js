import React, { useEffect, useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate, useLocation } from 'react-router-dom';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { LOGIN_SESSION_CHECK_DELAY } from '../../constants/session';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import SocialSignupModal from './SocialSignupModal';
import AccountIntegrationModal from './AccountIntegrationModal';
import TenantSelection from './TenantSelection';
import { API_BASE_URL } from '../../constants/api';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, checkSession } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
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
        const branchId = searchParams.get('branchId');
        const branchName = searchParams.get('branchName');
        const branchCode = searchParams.get('branchCode');
        const needsBranchMapping = searchParams.get('needsBranchMapping');
        const error = searchParams.get('error');
        const requiresSignup = searchParams.get('requiresSignup');
        
        console.log('📋 OAuth2 콜백 파라미터:', { 
          success, provider, userId, email, name, nickname, role, profileImageUrl, providerUserId, 
          branchId, branchName, branchCode, needsBranchMapping, error, requiresSignup
        });
        
        if (error) {
          console.error('❌ OAuth2 오류:', error);
          setError(`OAuth2 인증 오류: ${error}`);
          notificationManager.show('OAuth2 인증에 실패했습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!success || success !== 'true') {
          console.error('❌ OAuth2 성공 플래그가 없습니다');
          setError('OAuth2 인증이 완료되지 않았습니다.');
          notificationManager.show('OAuth2 인증이 완료되지 않았습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!provider) {
          console.error('❌ Provider 정보가 없습니다');
          setError('OAuth2 제공자 정보를 찾을 수 없습니다.');
          notificationManager.show('OAuth2 제공자 정보를 찾을 수 없습니다.', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // 계정 통합이 필요한 경우
        if (requiresAccountIntegration === 'true') {
          console.log('🔗 OAuth2 계정 통합 필요:', { provider, email, name, nickname });
          
          // 성공 메시지 표시
          notificationManager.show(`${provider} 소셜 로그인 성공! 기존 계정과 연결해주세요.`, 'success');
          
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
          
          // 학원 시스템 회원가입 모드 확인
          const academyTenantId = sessionStorage.getItem('academy_tenant_id');
          const academySignupMode = sessionStorage.getItem('academy_signup_mode') === 'true';
          
          if (academySignupMode && academyTenantId) {
            console.log('🎓 학원 시스템 회원가입 모드:', { tenantId: academyTenantId });
            // 학원 시스템 회원가입 모드: 테넌트 정보 포함
            const userData = {
              provider: provider,
              providerUserId: providerUserId,
              email: email,
              name: name,
              nickname: nickname,
              profileImageUrl: profileImageUrl,
              tenantId: academyTenantId,
              isAcademySignup: true
            };
            
            setSocialUserData(userData);
            setShowSignupModal(true);
            setIsProcessing(false);
            
            // sessionStorage 정리
            sessionStorage.removeItem('academy_tenant_id');
            sessionStorage.removeItem('academy_signup_mode');
            
            return;
          }
          
          // 일반 회원가입 모드
          // 성공 메시지 표시
          notificationManager.show(`${provider} 소셜 로그인 성공! 회원가입을 완료해주세요.`, 'success');
          
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
        notificationManager.show(`${provider} 소셜 로그인에 성공했습니다!`, 'success');
        
        // 사용자 정보를 중앙 세션에 설정
        if (userId && email) {
          const userInfo = {
            id: parseInt(userId),
            email: email,
            name: name,
            nickname: nickname,
            role: role,
            profileImageUrl: profileImageUrl,
            provider: provider,
            branchId: branchId ? parseInt(branchId) : null,
            branchName: branchName,
            branchCode: branchCode,
            needsBranchMapping: needsBranchMapping === 'true'
          };
          
          // 지점 매핑이 필요한 경우 로그인하지 않고 모달 표시
          if (userInfo.needsBranchMapping) {
            console.log('🏢 지점 매핑 필요 - 로그인 중단하고 모달 표시');
            setSocialUserData({
              provider: provider,
              email: email,
              name: name,
              nickname: nickname,
              providerUserId: providerUserId,
              profileImageUrl: profileImageUrl,
              needsBranchMapping: true
            });
            setShowSignupModal(true);
            return;
          }
          
          // 중앙 세션에 사용자 정보 설정
          const loginSuccess = await login(userInfo, {
            accessToken: 'oauth2_token',
            refreshToken: 'oauth2_refresh_token'
          });
          console.log('✅ OAuth2 중앙 세션에 사용자 정보 설정:', userInfo);
          
          // 멀티 테넌트 사용자 확인
          const checkMultiTenantAndRedirect = async (userRole) => {
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
                  // 멀티 테넌트 사용자: 테넌트 목록 로드
                  const tenantsResponse = await fetch(`${API_BASE_URL}/api/auth/tenant/accessible`, {
                    credentials: 'include'
                  });
                  
                  if (tenantsResponse.ok) {
                    const tenantsData = await tenantsResponse.json();
                    if (tenantsData.success) {
                      const tenants = (tenantsData.tenants || []).map(tenant => ({
                        tenantId: tenant.tenantId,
                        tenantName: tenant.name,
                        businessType: tenant.businessType,
                        status: tenant.status,
                        tenantRole: tenant.tenantRole || null
                      }));
                      setAccessibleTenants(tenants);
                      setShowTenantSelection(true);
                      setIsProcessing(false);
                      return;
                    }
                  }
                }
              }
              
              // 단일 테넌트 사용자: 동적 대시보드로
              const authResponse = {
                success: true,
                user: userInfo,
                currentTenantRole: null // TODO: 세션에서 역할 정보 가져오기
              };
              await redirectToDynamicDashboard(authResponse, navigate);
            } catch (error) {
              console.error('멀티 테넌트 확인 오류:', error);
              // 오류 시에도 동적 대시보드로 이동
              const authResponse = {
                success: true,
                user: userInfo,
                currentTenantRole: null
              };
              await redirectToDynamicDashboard(authResponse, navigate);
            }
          };

          // 공통 리다이렉트 함수 사용
          const redirectToDashboard = (userRole) => {
            if (userRole) {
              console.log('🎯 대시보드 리다이렉트 시작:', userRole);
              console.log('🎯 사용자 정보:', userInfo);
              
              // 멀티 테넌트 확인 후 리다이렉트
              checkMultiTenantAndRedirect(userRole);
            } else {
              console.log('🎯 기본 대시보드로 리다이렉트');
              checkMultiTenantAndRedirect('CLIENT');
            }
          };

          if (loginSuccess) {
            console.log('✅ 중앙 세션 로그인 성공, 멀티 테넌트 확인 후 대시보드로 리다이렉트 시작');
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
        notificationManager.show('로그인 처리 중 오류가 발생했습니다.', 'error');
        
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
      <div className="oauth2-callback-processing">
        <div className="oauth2-callback-title">
          🔄 로그인 처리 중...
        </div>
        <div className="oauth2-callback-message">
          잠시만 기다려주세요.
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="oauth2-callback-error">
        <div className="oauth2-callback-error-title">
          ❌ 로그인 실패
        </div>
        <div className="oauth2-callback-error-message">
          {error}
        </div>
        <div className="oauth2-callback-error-redirect">
          잠시 후 로그인 페이지로 이동합니다...
        </div>
      </div>
    );
  }
  
  // 테넌트 선택 화면 표시
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
            notificationManager.show('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
            // 로그인 페이지로 이동
            navigate('/login');
          }}
        />
        
        <AccountIntegrationModal
          isOpen={showIntegrationModal}
          onClose={() => setShowIntegrationModal(false)}
          socialUserInfo={socialUserData}
          onIntegrationSuccess={async (response) => {
            console.log('계정 통합 성공:', response);
            setShowIntegrationModal(false);
            // 통합 성공 후 동적 대시보드로 이동
            await redirectToDynamicDashboard(response, navigate);
          }}
        />
      </>
    );
  }
  
  return null;
};

export default OAuth2Callback;
