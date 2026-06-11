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
 * Google Identity Services(GIS) Web Client ID — server-side auth-code (A-2) 흐름의
 * authorize URL 생성에 사용한다. 카카오/네이버와 100% 동일 패턴: 사용자가 BE 의
 * {@code /api/v1/auth/oauth2/google/authorize} 를 호출하여 Google 동의 화면 URL 을 받고,
 * Google → BE apex 콜백(`/api/v1/auth/google/callback`) 으로 redirect 된다.
 *
 * <p>**프로덕션 빌드**: 반드시 `REACT_APP_GOOGLE_CLIENT_ID` (또는 별칭
 * `REACT_APP_GOOGLE_WEB_CLIENT_ID`) 를 GitHub Actions secret 으로 주입해야 한다.
 * 미주입 시 GoogleLoginButton 은 비활성 분기로 빠진다.</p>
 *
 * <p>**Google Cloud Console 등록 (2026-06-10 A-2 마이그레이션)**:
 * <ul>
 *   <li>Authorized JavaScript origins: 테넌트 서브도메인과 apex 모두 등록.
 *       예) {@code https://core-solution.co.kr}, {@code https://mindgarden.core-solution.co.kr},
 *           {@code https://dev.core-solution.co.kr}, {@code https://mindgarden.dev.core-solution.co.kr},
 *           {@code http://localhost:3000}.
 *       Google 은 {@code https://*.core-solution.co.kr} 와일드카드를 지원하지 않으므로
 *       각 호스트를 명시 등록한다(`origin_mismatch` 차단).</li>
 *   <li>Authorized redirect URIs: apex 1개만 등록한다(테넌트는 state base64 로 복원).
 *       예) {@code https://core-solution.co.kr/api/v1/auth/google/callback},
 *           {@code https://dev.core-solution.co.kr/api/v1/auth/google/callback},
 *           {@code http://localhost:8080/api/v1/auth/google/callback}.</li>
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
 * Sign in with Apple (SIWA) Web Service ID — Apple Developer Console 에서 등록한
 * Service ID (예: {@code co.kr.coresolution.app.signin}). 운영 빌드 시
 * {@code REACT_APP_APPLE_CLIENT_ID} 를 GitHub Actions secret 으로 주입한다.
 *
 * <p>Apple JS SDK ({@code appleid.auth.js}) 의 {@code clientId} 파라미터로 사용된다.
 * 모바일 앱은 Bundle ID 를 사용하므로 본 상수와 무관하다.</p>
 *
 * <p>**Apple Developer Console 등록 가이드**:
 * <ul>
 *   <li>Service ID 생성: {@code co.kr.coresolution.app.signin}
 *       (또는 운영 정책상 결정한 reverse-DNS 형식).</li>
 *   <li>Web Domains: 테넌트 서브도메인과 apex 모두 등록.
 *       예) {@code core-solution.co.kr}, {@code app.core-solution.co.kr},
 *           {@code mindgarden.core-solution.co.kr},
 *           {@code dev.core-solution.co.kr},
 *           {@code mindgarden.dev.core-solution.co.kr}.
 *       Apple 은 와일드카드를 지원하지 않으므로 각 호스트를 명시 등록한다.</li>
 *   <li>DNS Verification 파일 호스팅 후 Apple Developer Console 에서 검증.</li>
 *   <li>Return URLs: apex 1개 등록(테넌트 식별은 state base64 로 복원 — 카카오/네이버 동일 패턴).
 *       예) {@code https://core-solution.co.kr/api/v1/auth/oauth/apple/callback}.</li>
 * </ul></p>
 */
const resolveAppleWebServiceId = () => {
  const fromEnv = process.env.REACT_APP_APPLE_CLIENT_ID || '';
  return String(fromEnv).trim();
};

export const APPLE_WEB_SERVICE_ID = resolveAppleWebServiceId();

/**
 * Apple 웹 로그인이 활성화되었는지(=Service ID 가 주입되었는지) 여부.
 *
 * <p>Apple 버튼 표시 가드에서 사용한다. placeholder 값(`local-dev-set-...`,
 * `your_...`, `placeholder*`)은 모두 비활성으로 본다(Google 가드와 동일 정책).</p>
 */
export const isAppleWebServiceIdConfigured = (() => {
  const id = APPLE_WEB_SERVICE_ID;
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

/**
 * Sign in with Apple (SIWA) — server-side auth-code 흐름 (2026-06-11, Google PR #204 패턴).
 *
 * <p>웹 흐름은 BE `/api/v1/auth/oauth2/apple/authorize` 가 authorize URL 을 생성하여
 * 이 상수 없이도 동작한다. 본 상수는 모바일 webview fallback / 기존 native iOS 흐름
 * (`POST /api/v1/auth/oauth/apple/login`) 호환을 위해 유지된다.</p>
 *
 * <p><b>scope=name email</b>: Apple 의 server-side `response_mode=form_post` 흐름에서는
 * 사용자 이름이 form 본문 `user` JSON 으로 정상 전달되므로 `name` 을 함께 요청한다.
 * 이전 `usePopup=true` + `web_message` 흐름은 멀티테넌트 와일드카드에서 거절되어 폐기됐다.</p>
 */
export const APPLE_OAUTH2_CONFIG = {
  clientId: ENV.APPLE.CLIENT_ID,
  redirectUri: ENV.APPLE.REDIRECT_URI,
  /** Apple JS SDK CDN — Apple HIG 권장 공식 자산 (모바일 fallback 용). */
  sdkUrl: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
  // server-side 흐름은 form_post 로 사용자 이름이 정상 전달되므로 scope=name email 복구.
  scope: 'name email',
  responseType: 'code id_token',
  responseMode: 'form_post',
  // 웹은 더 이상 popup 을 사용하지 않는다 (server-side auth-code 흐름).
  usePopup: false,
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
