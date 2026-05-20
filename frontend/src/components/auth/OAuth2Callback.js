import React, { useEffect, useState } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate, useLocation } from 'react-router-dom';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import SocialSignupModal from './SocialSignupModal';
import AccountIntegrationModal from './AccountIntegrationModal';
import TenantSelection from './TenantSelection';
import { toDisplayString } from '../../utils/safeDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  OAUTH_ACCOUNT_SELECTION_PREVIEW_PATH,
  OAUTH_ACCOUNT_SELECTION_COMPLETE_PATH
} from '../../constants/oauthAccountSelectionConstants';
import {
  OAUTH_ACCOUNT_SELECTION_STRINGS,
  buildOAuthAccountSelectionCandidatePrimaryLine,
  buildOAuthAccountSelectionCandidateSecondaryLine
} from '../../constants/oauthAccountSelectionStrings';
import {
  OAUTH_ACCOUNT_LINK_PROMPT,
  OAUTH_POST_SIGNUP_LOGIN_REMINDER,
  OAUTH_SIGNUP_REQUIRED_PROMPT,
  OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT
} from '../../constants/loginDisplay';
import { USER_ROLES } from '../../constants/roles';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_AUTH_TENANT_CHECK_MULTI = '/api/v1/auth/tenant/check-multi';
const API_AUTH_TENANT_ACCESSIBLE = '/api/v1/auth/tenant/accessible';


/** OAuth2 리다이렉트 error 쿼리 표시 상한 (민감·과다 노출 완화) */
const OAUTH2_ERROR_QUERY_DISPLAY_MAX_LEN = 200;

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSession, testLogin } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showPhoneAccountSelectionModal, setShowPhoneAccountSelectionModal] = useState(false);
  const [phoneAccountCandidates, setPhoneAccountCandidates] = useState([]);
  const [phoneSelectionToken, setPhoneSelectionToken] = useState(null);
  const [phoneSelectionTenantId, setPhoneSelectionTenantId] = useState(null);
  const [phoneSelectionProvider, setPhoneSelectionProvider] = useState(null);
  const [phoneSelectedUserId, setPhoneSelectedUserId] = useState('');
  const [phoneAccountSelectionLoading, setPhoneAccountSelectionLoading] = useState(false);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [socialUserData, setSocialUserData] = useState(null);

  const handlePhoneAccountSelectionConfirm = async() => {
    if (!phoneSelectionToken || !phoneSelectedUserId || !phoneSelectionTenantId) {
      return;
    }
    setPhoneAccountSelectionLoading(true);
    try {
      const raw = await StandardizedApi.post(
        OAUTH_ACCOUNT_SELECTION_COMPLETE_PATH,
        {
          selectionToken: phoneSelectionToken,
          selectedUserId: parseInt(phoneSelectedUserId, 10)
        },
        { headers: { 'X-Tenant-Id': phoneSelectionTenantId } }
      );
      const data =
        raw && typeof raw === 'object' && 'success' in raw && 'data' in raw ? raw.data : raw;
      if (!raw?.success || !data?.accessToken) {
        throw new Error(OAUTH_ACCOUNT_SELECTION_STRINGS.COMPLETE_FAILED);
      }
      const userInfo = {
        id: data.userId,
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        tenantId: data.tenantId,
        provider: phoneSelectionProvider
      };
      await testLogin(userInfo, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });
      setShowPhoneAccountSelectionModal(false);
      notificationManager.show(
        toDisplayString(OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT, OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT),
        'success'
      );
      const authResponse = { success: true, user: userInfo, currentTenantRole: null };
      await redirectToDynamicDashboard(authResponse, navigate);
    } catch (e) {
      console.error(e);
      notificationManager.show(
        e?.message || OAUTH_ACCOUNT_SELECTION_STRINGS.COMPLETE_FAILED,
        'error'
      );
    } finally {
      setPhoneAccountSelectionLoading(false);
    }
  };

  useEffect(() => {
    const handleOAuth2Callback = async() => {
      try {
        console.log('🔄 OAuth2 콜백 처리 시작');
        
        // URL 파라미터에서 정보 추출
        const searchParams = new URLSearchParams(location.search);
        const success = searchParams.get('success');
        const oauthLegacy = searchParams.get('oauth');
        const oauthSucceeded = success === 'true' || oauthLegacy === 'success';
        const provider = searchParams.get('provider');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const nickname = searchParams.get('nickname');
        const role = searchParams.get('role');
        const requiresAccountIntegration = searchParams.get('requiresAccountIntegration');
        const profileImageUrl = searchParams.get('profileImageUrl');
        const providerUserId = searchParams.get('providerUserId'); // 추가: SNS 사용자 ID
        const tenantId = searchParams.get('tenantId'); // 서브도메인에서 추출한 tenant_id
        const oauthAccessToken = searchParams.get('accessToken');
        const oauthRefreshToken = searchParams.get('refreshToken');
        // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
        const branchId = searchParams.get('branchId');
        const branchName = searchParams.get('branchName');
        // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
        const branchCode = searchParams.get('branchCode');
        const needsBranchMapping = searchParams.get('needsBranchMapping');
        const oauthErrorParam = searchParams.get('error');
        const requiresSignup = searchParams.get('requiresSignup');
        
        console.log('📋 OAuth2 콜백 파라미터:', { 
          success, provider, userId, email, name, nickname, role, profileImageUrl, providerUserId, 
          branchId, branchName, branchCode, needsBranchMapping, error: oauthErrorParam, requiresSignup
        });
        
        if (oauthErrorParam) {
          console.error('❌ OAuth2 오류:', oauthErrorParam);
          let decodedError = oauthErrorParam;
          try {
            decodedError = decodeURIComponent(oauthErrorParam);
          } catch {
            decodedError = oauthErrorParam;
          }
          const displayError = toDisplayString(decodedError, 'OAuth2 인증에 실패했습니다.');
          const truncated =
            displayError.length > OAUTH2_ERROR_QUERY_DISPLAY_MAX_LEN
              ? `${displayError.slice(0, OAUTH2_ERROR_QUERY_DISPLAY_MAX_LEN)}…`
              : displayError;
          setError(truncated);
          notificationManager.show(truncated, 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!oauthSucceeded) {
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

        const parsedOAuthUserId =
          userId != null && String(userId).trim() !== '' ? parseInt(userId, 10) : NaN;
        const hasOAuthUserSessionParams =
          oauthSucceeded &&
          Number.isFinite(parsedOAuthUserId) &&
          parsedOAuthUserId > 0;

        const accountSelection = searchParams.get('accountSelection');
        const selectionToken = searchParams.get('selectionToken');
        if (
          oauthSucceeded &&
          accountSelection === 'required' &&
          selectionToken &&
          tenantId
        ) {
          setPhoneSelectionToken(selectionToken);
          setPhoneSelectionTenantId(tenantId);
          setPhoneSelectionProvider(provider);
          try {
            const previewRaw = await StandardizedApi.post(
              OAUTH_ACCOUNT_SELECTION_PREVIEW_PATH,
              { selectionToken },
              { headers: { 'X-Tenant-Id': tenantId } }
            );
            const preview =
              previewRaw &&
              typeof previewRaw === 'object' &&
              'success' in previewRaw &&
              'data' in previewRaw
                ? previewRaw.data
                : previewRaw;
            if (!previewRaw?.success || !preview?.candidates?.length) {
              throw new Error(OAUTH_ACCOUNT_SELECTION_STRINGS.LOAD_PREVIEW_FAILED);
            }
            setPhoneAccountCandidates(preview.candidates);
            setPhoneSelectedUserId(String(preview.candidates[0].userId));
            setShowPhoneAccountSelectionModal(true);
            notificationManager.show(OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_TITLE, 'info');
          } catch (previewErr) {
            console.error('OAuth 계정 선택 미리보기 실패:', previewErr);
            const msg =
              previewErr?.message || OAUTH_ACCOUNT_SELECTION_STRINGS.LOAD_PREVIEW_FAILED;
            setError(msg);
            notificationManager.show(msg, 'error');
            setTimeout(() => navigate('/login'), 3000);
          } finally {
            setIsProcessing(false);
          }
          return;
        }
        
        // 계정 통합이 필요한 경우
        if (requiresAccountIntegration === 'true') {
          console.log('🔗 OAuth2 계정 통합 필요:', { provider, email, name, nickname });
          
          // 성공 메시지 표시
          notificationManager.show(
            toDisplayString(OAUTH_ACCOUNT_LINK_PROMPT, OAUTH_ACCOUNT_LINK_PROMPT),
            'info'
          );
          
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
        
        // 회원가입이 필요한 경우(미등록 소셜). JWT·userId가 이미 있으면 (a)~(d) 매칭 로그인으로 간주하고 이 분기는 건너뜀.
        if (requiresSignup === 'true' && !hasOAuthUserSessionParams) {
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
          
          // 서브도메인에서 감지한 tenant_id 확인 (URL 파라미터 또는 sessionStorage)
          const detectedTenantId = tenantId || sessionStorage.getItem('subdomain_tenant_id');
          
          // 일반 회원가입 모드 — success 토스트는 “가입 완료”로 오인되므로 info + SSOT 문구
          notificationManager.show(
            toDisplayString(OAUTH_SIGNUP_REQUIRED_PROMPT, OAUTH_SIGNUP_REQUIRED_PROMPT),
            'info'
          );
          
          // SNS 사용자 정보 설정
          const userData = {
            provider: provider,
            providerUserId: providerUserId, // 추가: SNS 사용자 ID
            email: email,
            name: name,
            nickname: nickname,
            profileImageUrl: profileImageUrl,
            tenantId: detectedTenantId // 서브도메인에서 추출한 tenant_id 포함
          };
          
          // tenantId가 있으면 로그 출력
          if (detectedTenantId) {
            console.log('✅ 서브도메인에서 추출한 tenant_id 사용: tenantId=', detectedTenantId);
          }
          
          setSocialUserData(userData);
          setShowSignupModal(true);
          setIsProcessing(false);
          
          return;
        }
        
        // 성공적인 OAuth2 로그인 처리 (기존 사용자·(c)(d) 이메일/파생 ID 매칭 등)
        console.log('✅ OAuth2 로그인 성공:', { provider, userId, email, name, nickname, role });
        console.log('🔍 OAuth2 콜백 URL 파라미터:', { userId, email, name, nickname, role, provider });

        if (!hasOAuthUserSessionParams) {
          setError('OAuth2 로그인 정보가 불완전합니다. 다시 시도해 주세요.');
          notificationManager.show(
            toDisplayString('OAuth2 로그인 정보가 불완전합니다. 다시 시도해 주세요.'),
            'error'
          );
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        notificationManager.show(
          toDisplayString(OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT, OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT),
          'success'
        );

        // 사용자 정보를 중앙 세션에 설정
        const userInfo = {
          id: parsedOAuthUserId,
          email: email || '',
          name: name,
          nickname: nickname,
          role: role,
          profileImageUrl: profileImageUrl,
          provider: provider,
          ...(tenantId ? { tenantId } : {}),
          // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
          branchId: branchId ? parseInt(branchId, 10) : null,
          branchName: branchName,
          // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
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

        // 중앙 세션에 사용자 정보 설정 (비밀번호 로그인 API 호출 없음)
        const loginSuccess = await testLogin(userInfo, {
          accessToken: oauthAccessToken || 'oauth2_token',
          refreshToken: oauthRefreshToken || 'oauth2_refresh_token'
        });
        console.log('✅ OAuth2 중앙 세션에 사용자 정보 설정:', userInfo);

        // 멀티 테넌트 사용자 확인 (X-Tenant-Id: 쿼리·사용자 정보 우선)
        const checkMultiTenantAndRedirect = async(userRole) => {
          try {
            const tenantHeader = (tenantId || userInfo.tenantId || '').trim();
            const tenantApiOptions =
              tenantHeader.length > 0
                ? { headers: { 'X-Tenant-Id': tenantHeader }, unwrapApiEnvelope: false }
                : { unwrapApiEnvelope: false };

            const checkRaw = await StandardizedApi.get(
              API_AUTH_TENANT_CHECK_MULTI,
              {},
              tenantApiOptions
            );
            const checkEnvelope =
              checkRaw && typeof checkRaw === 'object' ? checkRaw : {};
            const multiData =
              'success' in checkEnvelope && 'data' in checkEnvelope
                ? checkEnvelope.data
                : checkEnvelope;
            const checkOk =
              checkEnvelope.success !== false &&
              checkRaw != null &&
              multiData &&
              typeof multiData === 'object';

            if (checkOk && multiData.isMultiTenant) {
              const tenantsRaw = await StandardizedApi.get(
                API_AUTH_TENANT_ACCESSIBLE,
                {},
                tenantApiOptions
              );
              const tenantsEnvelope =
                tenantsRaw && typeof tenantsRaw === 'object' ? tenantsRaw : {};
              const tenantsData =
                'success' in tenantsEnvelope && 'data' in tenantsEnvelope
                  ? tenantsEnvelope.data
                  : tenantsEnvelope;
              const tenantList =
                (tenantsData && tenantsData.tenants) || tenantsEnvelope.tenants || [];
              if (Array.isArray(tenantList) && tenantList.length > 0) {
                const tenants = tenantList.map((tenant) => ({
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

            const authResponse = {
              success: true,
              user: userInfo,
              currentTenantRole: null
            };
            await redirectToDynamicDashboard(authResponse, navigate);
          } catch (error) {
            console.error('멀티 테넌트 확인 오류:', error);
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

            checkMultiTenantAndRedirect(userRole);
          } else {
            console.log('🎯 기본 대시보드로 리다이렉트');
            checkMultiTenantAndRedirect(USER_ROLES.CLIENT);
          }
        };

        if (loginSuccess) {
          console.log('✅ 중앙 세션 로그인 성공, 멀티 테넌트 확인 후 대시보드로 리다이렉트 시작');
          redirectToDashboard(role);
        } else {
          console.error('❌ OAuth2 중앙 세션 로그인 실패, 재시도...');
          setTimeout(async() => {
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
            } catch (retryErr) {
              console.error('❌ OAuth2 세션 재확인 실패:', retryErr);
              redirectToDashboard(role);
            }
          }, 500);
        }

        sessionStorage.setItem('oauth2_user', JSON.stringify(userInfo));
        
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
  if (showPhoneAccountSelectionModal && phoneAccountCandidates.length > 0) {
    return (
      <UnifiedModal
        isOpen
        onClose={() => {
          if (!phoneAccountSelectionLoading) {
            navigate('/login');
          }
        }}
        title={OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_TITLE}
        subtitle={OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_SUBTITLE}
        size="medium"
        variant="confirm"
        showCloseButton={!phoneAccountSelectionLoading}
        backdropClick={!phoneAccountSelectionLoading}
        loading={phoneAccountSelectionLoading}
        actions={(
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: phoneAccountSelectionLoading
            })}
            onClick={handlePhoneAccountSelectionConfirm}
            disabled={phoneAccountSelectionLoading || !phoneSelectedUserId}
            loading={phoneAccountSelectionLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick
          >
            {OAUTH_ACCOUNT_SELECTION_STRINGS.CONFIRM}
          </MGButton>
        )}
      >
        <div className="mg-v2-radio-group">
          {phoneAccountCandidates.map((c) => {
            const secondaryLine = buildOAuthAccountSelectionCandidateSecondaryLine(c);
            return (
              <label key={c.userId} className="mg-v2-radio-option">
                <input
                  type="radio"
                  className="mg-v2-radio"
                  name="oauthPhoneAccount"
                  value={String(c.userId)}
                  checked={phoneSelectedUserId === String(c.userId)}
                  onChange={() => setPhoneSelectedUserId(String(c.userId))}
                />
                <div className="mg-v2-radio-content">
                  <span className="mg-v2-radio-label">
                    {buildOAuthAccountSelectionCandidatePrimaryLine(c)}
                  </span>
                  {secondaryLine ? (
                    <span className="mg-v2-text-secondary">{secondaryLine}</span>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </UnifiedModal>
    );
  }

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
            notificationManager.show(
              toDisplayString(OAUTH_POST_SIGNUP_LOGIN_REMINDER, OAUTH_POST_SIGNUP_LOGIN_REMINDER),
              'success'
            );
            // 로그인 페이지로 이동
            navigate('/login');
          }}
        />
        
        <AccountIntegrationModal
          isOpen={showIntegrationModal}
          onClose={() => setShowIntegrationModal(false)}
          socialUserInfo={socialUserData}
          onIntegrationSuccess={async(response) => {
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
