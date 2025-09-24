/**
 * 소셜 로그인 유틸리티
 * 다양한 소셜 플랫폼 로그인 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

import { authAPI } from './ajax';
import { storage, sessionStorage } from './common';
import { AUTH_API, API_BASE_URL } from '../constants/api';
import { 
  KAKAO_OAUTH2_CONFIG, 
  NAVER_OAUTH2_CONFIG,
  GOOGLE_OAUTH2_CONFIG,
  FACEBOOK_OAUTH2_CONFIG,
  getOAuth2Config as getOAuth2ConfigFromConstants
} from '../constants/oauth2';
import { setLoginSession, redirectToDashboard, logSessionInfo } from './session';
import notificationManager from './notification';
import { cachedApiCall, CACHE_CONFIG } from './apiCache';

let oauth2Config = null;

/**
 * OAuth2 초기화 (캐시 적용)
 */
export const initializeOAuth2 = async () => {
  try {
    const config = await cachedApiCall(
      '/api/auth/config/oauth2',
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
const generateCodeChallenge = async (verifier) => {
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
export const kakaoLogin = async () => {
  try {
    console.log('=== 카카오 로그인 시작 ===');
    
    // 백엔드의 인증 URL 생성 엔드포인트 호출
    console.log('백엔드 API 호출 시작:', `${API_BASE_URL}${AUTH_API.KAKAO_AUTHORIZE}`);
    const response = await fetch(`${API_BASE_URL}${AUTH_API.KAKAO_AUTHORIZE}`);
    console.log('백엔드 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('백엔드 응답 오류:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('백엔드에서 받은 카카오 인증 URL:', data);
    
    if (data.success && data.authUrl) {
      const state = generateRandomState();
      sessionStorage.set('oauth_state', state);
      
      // state 파라미터 추가하여 리다이렉트
      const authUrl = `${data.authUrl}&state=${state}`;
      console.log('최종 카카오 OAuth2 인증 URL:', authUrl);
      console.log('=== 카카오 로그인 완료 ===');
      
      window.location.href = authUrl;
    } else {
      console.error('백엔드 응답 데이터 구조 오류:', data);
      throw new Error('백엔드에서 인증 URL을 받지 못했습니다.');
    }
  } catch (error) {
    console.error('카카오 로그인 상세 오류:', error);
    notificationManager.show(`카카오 로그인 오류: ${error.message}`, 'error');
  }
};

/**
 * 네이버 로그인
 */
export const naverLogin = async () => {
  try {
    console.log('=== 네이버 로그인 시작 ===');
    
    // 백엔드의 인증 URL 생성 엔드포인트 호출
    const response = await fetch(`${API_BASE_URL}${AUTH_API.NAVER_AUTHORIZE}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('백엔드에서 받은 네이버 인증 URL:', data);
    
    if (data.success && data.authUrl) {
      const state = generateRandomState();
      sessionStorage.set('oauth_state', state);
      
      // state 파라미터 추가하여 리다이렉트
      const authUrl = `${data.authUrl}&state=${state}`;
      console.log('최종 네이버 OAuth2 인증 URL:', authUrl);
      console.log('=== 네이버 로그인 완료 ===');
      
      window.location.href = authUrl;
    } else {
      throw new Error('백엔드에서 인증 URL을 받지 못했습니다.');
    }
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    notificationManager.show('네이버 로그인을 시작할 수 없습니다.', 'error');
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
    alert('구글 로그인을 시작할 수 없습니다.');
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
    alert('페이스북 로그인을 시작할 수 없습니다.');
  }
};

/**
 * OAuth2 콜백 처리
 */
export const handleOAuthCallback = async (provider, code, state) => {
  try {
    const savedState = sessionStorage.get('oauth_state');
    if (state !== savedState) {
      throw new Error('OAuth2 state 검증 실패');
    }
    
    sessionStorage.remove('oauth_state');
    const codeVerifier = sessionStorage.get('pkce_code_verifier');
    if (codeVerifier) {
      sessionStorage.remove('pkce_code_verifier');
    }
    
    console.log(`${provider} OAuth2 콜백 처리:`, { code, state, codeVerifier });
    
    // 백엔드로 인증 코드 전송
    const response = await fetch(`${AUTH_API.OAUTH2_CALLBACK}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        provider, 
        code, 
        state,
        codeVerifier 
      })
    });

    if (!response.ok) {
      throw new Error('OAuth2 콜백 처리 실패');
    }
    
    const result = await response.json();
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
        throw new Error('세션 설정에 실패했습니다.');
      }
    } else if (result.requiresSignup) {
      console.log('간편 회원가입 필요:', result.socialUserInfo);
      return { requiresSignup: true, socialUserInfo: result.socialUserInfo };
    } else {
      throw new Error(result.message || 'OAuth2 인증 실패');
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
export const socialLogout = async () => {
  try {
    await authAPI.logout();
    
    // 세션 정리
    import('./session').then(({ clearSession }) => {
      clearSession();
    });
    
    sessionStorage.remove('oauth_state');
    sessionStorage.remove('pkce_code_verifier');
    
    console.log('소셜 로그아웃 완료');
    window.location.href = '/login';
  } catch (error) {
    console.error('소셜 로그아웃 오류:', error);
  }
};

/**
 * 소셜 계정 연동 상태 확인
 */
export const checkSocialAccountStatus = async (provider, email) => {
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
export const unlinkSocialAccount = async (provider, email) => {
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
