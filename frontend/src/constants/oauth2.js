/**
 * OAuth2 설정 상수
 * 카카오, 네이버 등 소셜 로그인 설정
 */

// 카카오 OAuth2 설정
export const KAKAO_OAUTH2_CONFIG = {
  clientId: process.env.REACT_APP_KAKAO_CLIENT_ID || 'cbb457cfb5f9351fd495be4af2b11a34',
  redirectUri: process.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback',
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
  scope: 'profile_nickname,profile_image,account_email',
  responseType: 'code',
  state: 'kakao_login'
};

// 네이버 OAuth2 설정
export const NAVER_OAUTH2_CONFIG = {
  clientId: process.env.REACT_APP_NAVER_CLIENT_ID || 'vTKNlxYKIfo1uCCXaDfk',
  clientSecret: process.env.REACT_APP_NAVER_CLIENT_SECRET || 'V_b3omW5pu',
  redirectUri: process.env.REACT_APP_NAVER_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback',
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
  userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
  scope: 'name email profile_image',
  responseType: 'code',
  state: 'naver_login'
};

// 구글 OAuth2 설정
export const GOOGLE_OAUTH2_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id',
  redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/login',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scope: 'email profile',
  responseType: 'code',
  state: 'google_login'
};

// 페이스북 OAuth2 설정
export const FACEBOOK_OAUTH2_CONFIG = {
  clientId: process.env.REACT_APP_FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
  redirectUri: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || 'http://localhost:3000/login',
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  userInfoUrl: 'https://graph.facebook.com/v18.0/me',
  scope: 'email public_profile',
  responseType: 'code',
  state: 'facebook_login'
};

// OAuth2 공통 설정
export const OAUTH2_COMMON = {
  stateLength: 32,
  codeVerifierLength: 128,
  challengeMethod: 'S256'
};

// 환경별 설정
export const getOAuth2Config = (provider) => {
  switch (provider.toUpperCase()) {
    case 'KAKAO':
      return KAKAO_OAUTH2_CONFIG;
    case 'NAVER':
      return NAVER_OAUTH2_CONFIG;
    case 'GOOGLE':
      return GOOGLE_OAUTH2_CONFIG;
    case 'FACEBOOK':
      return FACEBOOK_OAUTH2_CONFIG;
    default:
      throw new Error(`지원하지 않는 OAuth2 제공자: ${provider}`);
  }
};

export default {
  KAKAO_OAUTH2_CONFIG,
  NAVER_OAUTH2_CONFIG,
  GOOGLE_OAUTH2_CONFIG,
  FACEBOOK_OAUTH2_CONFIG,
  OAUTH2_COMMON,
  getOAuth2Config
};
