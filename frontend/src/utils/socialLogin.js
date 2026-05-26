/**
 * 소셜 로그인 유틸리티
/**
 * 다양한 소셜 플랫폼 로그인 처리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

import { authAPI } from './ajax';
import { storage, sessionStorage } from './common';
import { AUTH_API, API_BASE_URL } from '../constants/api';
import StandardizedApi from './standardizedApi';
import { 
  KAKAO_OAUTH2_CONFIG, 
  NAVER_OAUTH2_CONFIG,
  GOOGLE_OAUTH2_CONFIG,
  FACEBOOK_OAUTH2_CONFIG,
  getOAuth2Config as getOAuth2ConfigFromConstants
} from '../constants/oauth2';
import { setLoginSession, redirectToDashboard, logSessionInfo } from './session';
import { redirectToLoginPageOnce } from './sessionRedirect';
import notificationManager from './notification';
import { cachedApiCall, CACHE_CONFIG } from './apiCache';
import i18n from '../i18n';

let oauth2Config = null;

/**
 * OAuth2 초기화 (캐시 적용)
 */
export const initializeOAuth2 = async() => {
  try {
    const config = await cachedApiCall(
      AUTH_API.GET_OAUTH2_CONFIG,
      {},
      CACHE_CONFIG.OAUTH2_CONFIG.ttl
    );
    oauth2Config = config;
    console.log('OAuth2 설정 로드 완료:', config);
  } catch (error) {
    console.error('OAuth2 설정 로드 실패:', error);
    // 기본 설정 사용
    oauth2Config = {
      kakao: KAKAO_OAUTH2_CONFIG,
      naver: NAVER_OAUTH2_CONFIG,
      google: GOOGLE_OAUTH2_CONFIG,
      facebook: FACEBOOK_OAUTH2_CONFIG
    };
    console.log('기본 OAuth2 설정을 사용합니다:', oauth2Config);
  }
};

/**
 * OAuth2 설정 가져오기
 */
export const getOAuth2Config = () => {
  if (!oauth2Config) {
    console.warn('OAuth2 설정이 초기화되지 않았습니다. 기본 설정을 사용합니다.');
    oauth2Config = {
      kakao: KAKAO_OAUTH2_CONFIG,
      naver: NAVER_OAUTH2_CONFIG,
      google: GOOGLE_OAUTH2_CONFIG,
      facebook: FACEBOOK_OAUTH2_CONFIG
    };
  }
  return oauth2Config;
};

/**
 * 랜덤 state 생성
 */
const generateRandomState = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * PKCE code verifier 생성
 */
const generateCodeVerifier = (length = 128) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * PKCE code challenge 생성 (SHA256)
 */
const generateCodeChallenge = async(verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

/**
 * 카카오 로그인
 */
export const kakaoLogin = async() => {
  try {
    console.log('=== 카카오 로그인 시작 ===');
    
    // 서브도메인 확인 (로컬 환경에서는 스킵)
    const host = window.location.hostname;
    const isLocalEnv = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalEnv) {
      const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
      const hostParts = host.split('.');
      const firstLabel = hostParts[0];
      const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;

      if (!hasSubdomain) {
        const friendlyMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
        console.error('⚠️ 서브도메인 없음:', friendlyMessage);
        notificationManager.show(friendlyMessage, 'error');
        throw new Error(i18n.t('common:utils.socialLogin.t_11aa9c1b'));
      }
    }

    // 백엔드의 인증 URL 생성 엔드포인트 호출
    // OAuth 인가 API는 세션 쿠키(JSESSIONID)가 필요함 — cross-origin fetch 시 credentials 필수
    console.log('백엔드 API 호출 시작:', `${API_BASE_URL}${AUTH_API.KAKAO_AUTHORIZE}`);
    const response = await fetch(`${API_BASE_URL}${AUTH_API.KAKAO_AUTHORIZE}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    console.log('백엔드 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = i18n.t('common:utils.socialLogin.t_f2ce3edf');
      try {
        const errorData = await response.json();
        // 백엔드 오류 메시지 추출
        if (errorData.message) {
          errorMessage = errorData.message;
          // 서브도메인 관련 오류인 경우 명확한 메시지로 변환
          if (errorMessage.includes(i18n.t('common:utils.socialLogin.t_73976704')) || errorMessage.includes(i18n.t('common:utils.socialLogin.t_b1f35800'))) {
            errorMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
          }
        } else if (errorData.data && errorData.data.message) {
          errorMessage = errorData.data.message;
          // 서브도메인 관련 오류인 경우 명확한 메시지로 변환
          if (errorMessage.includes(i18n.t('common:utils.socialLogin.t_73976704')) || errorMessage.includes(i18n.t('common:utils.socialLogin.t_b1f35800'))) {
            errorMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
          }
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 텍스트로 처리
        const errorText = await response.text();
        console.error('백엔드 응답 오류:', errorText);
      }
      // 공통 알림으로 오류 표시
      notificationManager.show(errorMessage, 'error');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log('백엔드에서 받은 카카오 인증 URL:', data);
    
    // ApiResponse 래퍼 처리: data.data.authUrl 또는 data.authUrl
    const authUrl = (data.data && data.data.authUrl) || data.authUrl;
    const state = (data.data && data.data.state) || data.state;
    
    if (data.success && authUrl) {
      // 백엔드에서 이미 state를 포함한 URL을 반환하므로, 프론트엔드에서 추가하지 않음
      // 백엔드에서 반환한 state를 sessionStorage에 저장
      if (state) {
        sessionStorage.set('oauth_state', state);
      }
      
      console.log('최종 카카오 OAuth2 인증 URL:', authUrl);
      console.log('=== 카카오 로그인 완료 ===');
      
      window.location.href = authUrl;
    } else {
      console.error('백엔드 응답 데이터 구조 오류:', data);
      throw new Error(i18n.t('common:utils.socialLogin.t_25681767'));
    }
  } catch (error) {
    console.error('카카오 로그인 상세 오류:', error);
    notificationManager.show(i18n.t('common:utils.socialLogin.t_8cdad74b'), 'error');
  }
};

/**
 * 네이버 로그인
 */
export const naverLogin = async() => {
  try {
    console.log('=== 네이버 로그인 시작 ===');
    
    // 서브도메인 확인 (로컬 환경에서는 스킵)
    const host = window.location.hostname;
    const isLocalEnv = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalEnv) {
      const defaultSubdomains = ['dev', 'app', 'api', 'staging', 'www'];
      const hostParts = host.split('.');
      const firstLabel = hostParts[0];
      const hasSubdomain = !defaultSubdomains.includes(firstLabel) && hostParts.length > 2;

      if (!hasSubdomain) {
        const friendlyMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
        console.error('⚠️ 서브도메인 없음:', friendlyMessage);
        notificationManager.show(friendlyMessage, 'error');
        throw new Error(i18n.t('common:utils.socialLogin.t_11aa9c1b'));
      }
    }

    // 백엔드의 인증 URL 생성 엔드포인트 호출
    // OAuth 인가 API는 세션 쿠키(JSESSIONID)가 필요함 — cross-origin fetch 시 credentials 필수
    const response = await fetch(`${API_BASE_URL}${AUTH_API.NAVER_AUTHORIZE}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      let errorMessage = i18n.t('common:utils.socialLogin.t_d5a04e24');
      try {
        const errorData = await response.json();
        // 백엔드 오류 메시지 추출
        if (errorData.message) {
          errorMessage = errorData.message;
          // 서브도메인 관련 오류인 경우 명확한 메시지로 변환
          if (errorMessage.includes(i18n.t('common:utils.socialLogin.t_73976704')) || errorMessage.includes(i18n.t('common:utils.socialLogin.t_b1f35800'))) {
            errorMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
          }
        } else if (errorData.data && errorData.data.message) {
          errorMessage = errorData.data.message;
          // 서브도메인 관련 오류인 경우 명확한 메시지로 변환
          if (errorMessage.includes(i18n.t('common:utils.socialLogin.t_73976704')) || errorMessage.includes(i18n.t('common:utils.socialLogin.t_b1f35800'))) {
            errorMessage = i18n.t('common:utils.socialLogin.t_9caeef26');
          }
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 기본 메시지 사용
        console.error('네이버 로그인 오류:', parseError);
      }
      // 공통 알림으로 오류 표시
      notificationManager.show(errorMessage, 'error');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log('백엔드에서 받은 네이버 인증 URL:', data);
    
    // ApiResponse 래퍼 처리: data.data.authUrl 또는 data.authUrl
    const authUrl = (data.data && data.data.authUrl) || data.authUrl;
    const state = (data.data && data.data.state) || data.state;
    
    if (data.success && authUrl) {
      // 백엔드에서 이미 state를 포함한 URL을 반환하므로, 프론트엔드에서 추가하지 않음
      // 백엔드에서 반환한 state를 sessionStorage에 저장
      if (state) {
        sessionStorage.set('oauth_state', state);
      }
      
      console.log('최종 네이버 OAuth2 인증 URL:', authUrl);
      console.log('=== 네이버 로그인 완료 ===');
      
      window.location.href = authUrl;
    } else {
      console.error('백엔드 응답 데이터 구조 오류:', data);
      throw new Error(i18n.t('common:utils.socialLogin.t_25681767'));
    }
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    notificationManager.show(i18n.t('common:utils.socialLogin.t_d5a04e24'), 'error');
  }
};

/**
 * 구글 로그인
 */
export const googleLogin = () => {
  try {
    // 직접 GOOGLE_OAUTH2_CONFIG 사용
    const config = GOOGLE_OAUTH2_CONFIG;
    const state = generateRandomState();
    const codeVerifier = generateCodeVerifier();
    
    sessionStorage.set('pkce_code_verifier', codeVerifier);
    sessionStorage.set('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType,
      state: state,
      scope: config.scope,
      code_challenge: codeVerifier, // PKCE 지원
      code_challenge_method: 'plain'
    });
    
    console.log('구글 OAuth2 인증 URL 생성:', `${config.authUrl}?${params.toString()}`);
    window.location.href = `${config.authUrl}?${params.toString()}`;
  } catch (error) {
    console.error('구글 로그인 오류:', error);
    notificationManager.show(i18n.t('common:utils.socialLogin.t_712c6d0b'), 'info');
  }
};

/**
 * 페이스북 로그인
 */
export const facebookLogin = () => {
  try {
    // 직접 FACEBOOK_OAUTH2_CONFIG 사용
    const config = FACEBOOK_OAUTH2_CONFIG;
    const state = generateRandomState();
    
    sessionStorage.set('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType,
      state: state,
      scope: config.scope
    });
    
    console.log('페이스북 OAuth2 인증 URL 생성:', `${config.authUrl}?${params.toString()}`);
    window.location.href = `${config.authUrl}?${params.toString()}`;
  } catch (error) {
    console.error('페이스북 로그인 오류:', error);
    notificationManager.show(i18n.t('common:utils.socialLogin.t_9cac74ea'), 'info');
  }
};

/**
 * OAuth2 콜백 처리
 */
export const handleOAuthCallback = async(provider, code, state) => {
  try {
    const savedState = sessionStorage.get('oauth_state');
    if (state !== savedState) {
      throw new Error(i18n.t('common:utils.socialLogin.t_28155c80'));
    }
    
    sessionStorage.remove('oauth_state');
    const codeVerifier = sessionStorage.get('pkce_code_verifier');
    if (codeVerifier) {
      sessionStorage.remove('pkce_code_verifier');
    }
    
    console.log(`${provider} OAuth2 콜백 처리:`, { code, state, codeVerifier });
    
    const raw = await StandardizedApi.post(
      AUTH_API.OAUTH2_CALLBACK,
      {
        provider,
        code,
        state,
        codeVerifier
      },
      { unwrapApiEnvelope: false }
    );

    const envelope = raw && typeof raw === 'object' ? raw : {};
    const result =
      envelope.data != null && typeof envelope.data === 'object'
        ? {
          ...envelope.data,
          success: envelope.success,
          message: envelope.message || envelope.data.message,
          requiresSignup: envelope.data.requiresSignup ?? envelope.requiresSignup,
          socialUserInfo: envelope.data.socialUserInfo ?? envelope.socialUserInfo
        }
        : envelope;
    console.log(`${provider} OAuth2 결과:`, result);
    
    if (result.success) {
      // 세션 설정
      const sessionSet = setLoginSession(result.userInfo, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });
      
      if (sessionSet) {
        // 세션 정보 로깅
        logSessionInfo();
        
        // 역할에 따른 대시보드로 리다이렉트
        redirectToDashboard(result.userInfo);
      } else {
        console.error('세션 설정에 실패했습니다.');
        // 세션 설정 실패 시에도 로그인 페이지로 이동하지 않음
        throw new Error(i18n.t('common:utils.socialLogin.t_53ec68ef'));
      }
    } else if (result.requiresSignup) {
      console.log('간편 회원가입 필요:', result.socialUserInfo);
      return { requiresSignup: true, socialUserInfo: result.socialUserInfo };
    } else {
      throw new Error(result.message || i18n.t('common:utils.socialLogin.t_9509df49'));
    }
  } catch (error) {
    console.error('OAuth2 콜백 처리 오류:', error);
    // 에러 발생 시 로그인 페이지로 리다이렉트하지 않고 에러를 던짐
    throw error;
  }
};

/**
 * 소셜 로그아웃
 */
export const socialLogout = async() => {
  try {
    await authAPI.logout();
    
    // 세션 정리
    import('./session').then(({ clearSession }) => {
      clearSession();
    });
    
    sessionStorage.remove('oauth_state');
    sessionStorage.remove('pkce_code_verifier');
    
    console.log('소셜 로그아웃 완료');
    redirectToLoginPageOnce();
  } catch (error) {
    console.error('소셜 로그아웃 오류:', error);
  }
};

/**
 * 소셜 계정 연동 상태 확인
 */
export const checkSocialAccountStatus = async(provider, email) => {
  try {
    const response = await fetch(`${AUTH_API.SOCIAL_STATUS}?provider=${provider}&email=${email}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('소셜 계정 상태 확인 오류:', error);
    throw error;
  }
};

/**
 * 소셜 계정 연동 해제
 */
export const unlinkSocialAccount = async(provider, email) => {
  try {
    const response = await fetch(`${AUTH_API.SOCIAL_UNLINK}?provider=${provider}&email=${email}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('소셜 계정 연동 해제 오류:', error);
    throw error;
  }
};

/**
 * OAuth2 초기화 실행
 */
initializeOAuth2();

export default {
  initializeOAuth2,
  getOAuth2Config,
  kakaoLogin,
  naverLogin,
  googleLogin,
  facebookLogin,
  handleOAuthCallback,
  socialLogout,
  checkSocialAccountStatus,
  unlinkSocialAccount
};
