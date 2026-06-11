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
 * Google Identity Services(GIS) Web Client ID — `GoogleLoginButton` 의 GIS 자산 변형 분기에서만
 * 참조된다. server-side auth-code 흐름(PR #211, 2026-06-11) 에서는 BE 가 client_id 를 보관하므로
 * FE 의 본 값은 인증에 사용되지 않으며, UI 분기(=GIS 로고 컴포넌트 vs 일반 MGButton)만 결정한다.
 *
 * <p>운영 로그인 페이지의 Google 버튼은 본 값 주입 여부와 무관하게 항상 노출된다
 * (UnifiedLogin §Google 가드 참조). 카카오/네이버와 100% 동일 패턴: 사용자가 BE
 * {@code /api/v1/auth/oauth2/google/authorize} 를 호출하여 동의 화면 URL 을 받고,
 * Google → BE apex 콜백({@code /api/v1/auth/google/callback}) 으로 redirect 된다.</p>
 *
 * <p>**프로덕션 빌드**: 본 값이 주입되면 GIS 로고 자산을 포함한 `GoogleLoginButton` 으로,
 * 미주입 시 동일한 server-side 흐름으로 redirect 하는 폴백 `MGButton` 으로 렌더된다.
 * 두 분기 모두 동일한 BE authorize 엔드포인트를 호출한다.</p>
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
 * Google 웹 client id 가 주입되었는지 여부 — `GoogleLoginButton` 의 GIS 로고 자산 분기 선택용.
 *
 * <p>**버튼 노출 가드가 아님** (PR #211 server-side flow 전환 이후). 운영 환경에서 본 값이
 * 비어 있어도 Google 버튼은 항상 노출되며, BE 가 authorize URL 을 생성한다. 본 값은 단지
 * UI 분기(=GIS 로고 vs 폴백 MGButton)에만 사용된다. placeholder(`local-dev-set-...`,
 * `your_...`, `placeholder*`) 는 모두 비활성으로 본다.</p>
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
 * Sign in with Apple (SIWA) Web Service ID — 레거시 Apple JS SDK (`appleid.auth.js`) 의
 * `clientId` 파라미터 호환용. PR #211 server-side auth-code 전환 이후 웹 흐름에서는
 * **사용되지 않으며**, BE `/api/v1/auth/oauth2/apple/authorize` 가 Service ID 와 JWT
 * 서명까지 모두 처리한다.
 *
 * <p>본 상수는 모바일 webview fallback 또는 향후 JS SDK 재도입 시 참조 가능하도록 유지된다.
 * 운영 빌드 시 {@code REACT_APP_APPLE_CLIENT_ID} 주입 여부와 무관하게 Apple 로그인 버튼은
 * 항상 노출된다(UnifiedLogin §Apple 가드 제거 — PR #211 hotfix).</p>
 *
 * <p>모바일 앱(iOS native SIWA) 은 Bundle ID 를 사용하므로 본 상수와 무관하다.</p>
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
 * Apple Service ID 가 주입되었는지 여부 — 레거시 호환 / 진단용.
 *
 * <p>**더 이상 Apple 버튼 표시 가드로 사용하지 않는다** (PR #211 server-side flow 전환).
 * BE 가 Service ID·client_secret JWT·redirect_uri 를 모두 보관하므로 FE 주입 여부와
 * 무관하게 Apple 버튼은 항상 노출된다. 본 플래그는 모바일 webview fallback 진단이나
 * 향후 JS SDK 재도입을 위해 export 만 유지한다. placeholder(`local-dev-set-...`,
 * `your_...`, `placeholder*`) 는 모두 비활성으로 본다(Google 와 동일 정책).</p>
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
