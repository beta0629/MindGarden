/**
 * OAuth2 설정 상수
/**
 * 카카오, 네이버 등 소셜 로그인 설정
 */

// 카카오 OAuth2 설정
import ENV from './environment';

export const KAKAO_OAUTH2_CONFIG = {
  clientId: ENV.KAKAO.CLIENT_ID,
  redirectUri: ENV.KAKAO.REDIRECT_URI,
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
  scope: 'profile_nickname,profile_image,account_email',
  responseType: 'code',
  state: 'kakao_login'
};

// 네이버 OAuth2 설정
export const NAVER_OAUTH2_CONFIG = {
  clientId: ENV.NAVER.CLIENT_ID,
  clientSecret: ENV.NAVER.CLIENT_SECRET,
  redirectUri: ENV.NAVER.REDIRECT_URI,
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
  userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
  scope: 'name email profile_image',
  responseType: 'code',
  state: 'naver_login'
};

// 구글 OAuth2 설정 (레거시 redirect 흐름 — 호환성 유지용)
export const GOOGLE_OAUTH2_CONFIG = {
  clientId: ENV.GOOGLE.CLIENT_ID,
  redirectUri: ENV.GOOGLE.REDIRECT_URI,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scope: 'email profile',
  responseType: 'code',
  state: 'google_login'
};

/**
 * Google Identity Services(GIS) Web Client ID — `@react-oauth/google` Provider 에 주입.
 *
 * <p>**프로덕션 빌드**: 반드시 `REACT_APP_GOOGLE_CLIENT_ID` (또는 별칭
 * `REACT_APP_GOOGLE_WEB_CLIENT_ID`) 를 GitHub Actions secret 으로 주입해야 한다.
 * 미주입 시 빈 문자열을 반환하므로 `<GoogleOAuthProvider>` 가 마운트되지 않고
 * `GoogleLoginButton` 도 비활성 분기로 빠진다(레거시 redirect 흐름 폴백 가능).</p>
 *
 * <p>웹 OAuth Consent 화면에 등록해야 할 Authorized JavaScript origins:
 * <ul>
 *   <li>{@code https://app.core-solution.co.kr}</li>
 *   <li>{@code https://dev.app.core-solution.co.kr}</li>
 *   <li>{@code https://*.core-solution.co.kr} (테넌트 서브도메인)</li>
 *   <li>{@code http://localhost:3000} (로컬 개발)</li>
 * </ul></p>
 *
 * <p>두 키를 모두 지원하는 이유: 모바일 앱은 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 명명을
 * 사용하고, 운영 GitHub secret 은 동일 값을 두 별칭에 매핑할 수 있도록 가드.</p>
 */
const resolveGoogleWebClientId = () => {
  const fromEnv = (
    process.env.REACT_APP_GOOGLE_CLIENT_ID
    || process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID
    || ''
  );
  return String(fromEnv).trim();
};

export const GOOGLE_WEB_CLIENT_ID = resolveGoogleWebClientId();

/**
 * Google 웹 로그인이 활성화되었는지(=client id 가 주입되었는지) 여부.
 *
 * <p>버튼 표시 가드 + 폴백 로직에서 사용한다. placeholder 값(`local-dev-set-...`,
 * `your_...`)은 모두 비활성으로 본다.</p>
 */
export const isGoogleWebClientIdConfigured = (() => {
  const id = GOOGLE_WEB_CLIENT_ID;
  if (!id) {
    return false;
  }
  const lower = id.toLowerCase();
  if (lower.startsWith('your_')) {
    return false;
  }
  if (lower.startsWith('local-dev-set-')) {
    return false;
  }
  if (lower.startsWith('placeholder')) {
    return false;
  }
  return true;
})();

// 페이스북 OAuth2 설정
export const FACEBOOK_OAUTH2_CONFIG = {
  clientId: ENV.FACEBOOK.CLIENT_ID,
  redirectUri: ENV.FACEBOOK.REDIRECT_URI,
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  userInfoUrl: 'https://graph.facebook.com/v18.0/me',
  scope: 'email public_profile',
  responseType: 'code',
  state: 'facebook_login'
};

/**
 * Sign in with Apple (SIWA) — Apple App Store 4.8 (T1) 대응.
 * Apple JS SDK 가 native-like 시트를 표시하고 identityToken·authorization code 를 반환한다.
 */
export const APPLE_OAUTH2_CONFIG = {
  clientId: ENV.APPLE.CLIENT_ID,
  redirectUri: ENV.APPLE.REDIRECT_URI,
  /** Apple JS SDK CDN — Apple HIG 권장 공식 자산. */
  sdkUrl: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
  scope: 'name email',
  responseType: 'code id_token',
  responseMode: 'form_post',
  usePopup: true,
  state: 'apple_login'
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
    case 'APPLE':
      return APPLE_OAUTH2_CONFIG;
    default:
      throw new Error(`지원하지 않는 OAuth2 제공자: ${provider}`);
  }
};

/** 로그인 화면 소셜·간편가입 후 안내 문구 */
export const OAUTH2_LOGIN_UI = {
  POST_SIGNUP_CALLOUT_TITLE: '회원가입이 완료되었습니다',
  POST_SIGNUP_CALLOUT_BODY: '가입 시 설정한 비밀번호로 로그인하면 서비스를 이용할 수 있습니다.',
  POST_SIGNUP_PRIMARY_CTA: '로그인 계속하기'
};

export default {
  KAKAO_OAUTH2_CONFIG,
  NAVER_OAUTH2_CONFIG,
  GOOGLE_OAUTH2_CONFIG,
  FACEBOOK_OAUTH2_CONFIG,
  APPLE_OAUTH2_CONFIG,
  OAUTH2_COMMON,
  getOAuth2Config
};
