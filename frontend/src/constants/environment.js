/**
 * 환경 변수 및 설정 상수. API URL·OAuth 값은 환경 변수 우선.
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */

const isProdBuild = process.env.NODE_ENV === 'production';

/**
 * 공개 OAuth 클라이언트 ID 등: 프로덕션 빌드에서는 REACT_APP_*만 사용(코드 폴백 없음).
 * 개발 빌드에서만 비어 있을 때 placeholder로 번들이 깨지지 않게 한다.
 *
 * @param {string} envKey process.env 키
 * @param {string} devPlaceholder 개발 전용 자리 표시 문자열(실제 자격 증명 아님)
 * @returns {string}
 */
const oauthPublicFromEnv = (envKey, devPlaceholder) => {
  const raw = process.env[envKey];
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw).trim();
  }
  if (isProdBuild) {
    return '';
  }
  return devPlaceholder;
};

/**
 * 클라이언트 시크릿: 저장소·번들에 폴백 없음. 반드시 REACT_APP_* 로만 주입.
 *
 * @param {string} envKey process.env 키
 * @returns {string}
 */
const oauthSecretFromEnv = (envKey) => {
  const raw = process.env[envKey];
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw).trim();
  }
  return '';
};

// 현재 환경에 따른 동적 URL 생성
const getBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('🔧 API_BASE_URL from env:', process.env.REACT_APP_API_BASE_URL);
    const envUrl = process.env.REACT_APP_API_BASE_URL.trim();
    if (envUrl === '' || envUrl === '""' || envUrl === "''") {
      console.log('🔧 환경변수가 빈 문자열 - 상대 경로 사용');
      return '';
    }
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.log('🔧 서버 환경: Nginx 프록시 사용 (상대 경로)', window.location.hostname);
      return '';
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 프로덕션 환경: Nginx 프록시 사용 (상대 경로)');
    return '';
  }

  console.log('🔧 로컬 개발 환경: 백엔드 직접 연결 (8080 포트)');
  return 'http://localhost:8080';
};

const getFrontendUrl = () => {
  if (process.env.REACT_APP_FRONTEND_URL) {
    return process.env.REACT_APP_FRONTEND_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

const DEV_OAUTH_ID_PLACEHOLDER = 'local-dev-set-REACT_APP_oauth-client-id';

const ENV = {
  get API_BASE_URL() {
    return getBaseUrl();
  },
  FRONTEND_URL: getFrontendUrl(),

  KAKAO: {
    CLIENT_ID: oauthPublicFromEnv('REACT_APP_KAKAO_CLIENT_ID', DEV_OAUTH_ID_PLACEHOLDER),
    REDIRECT_URI: process.env.REACT_APP_KAKAO_REDIRECT_URI
      || `${getBaseUrl()}/api/v1/auth/kakao/callback`
  },

  NAVER: {
    CLIENT_ID: oauthPublicFromEnv('REACT_APP_NAVER_CLIENT_ID', DEV_OAUTH_ID_PLACEHOLDER),
    CLIENT_SECRET: oauthSecretFromEnv('REACT_APP_NAVER_CLIENT_SECRET'),
    REDIRECT_URI: process.env.REACT_APP_NAVER_REDIRECT_URI
      || `${getBaseUrl()}/api/v1/auth/naver/callback`
  },

  GOOGLE: {
    CLIENT_ID: oauthPublicFromEnv('REACT_APP_GOOGLE_CLIENT_ID', DEV_OAUTH_ID_PLACEHOLDER),
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI
      || `${getBaseUrl()}/api/v1/auth/google/callback`
  },

  FACEBOOK: {
    CLIENT_ID: oauthPublicFromEnv('REACT_APP_FACEBOOK_CLIENT_ID', DEV_OAUTH_ID_PLACEHOLDER),
    REDIRECT_URI: process.env.REACT_APP_FACEBOOK_REDIRECT_URI
      || `${getBaseUrl()}/api/v1/auth/facebook/callback`
  }
};

export const createApiUrl = (endpoint) => {
  return `${ENV.API_BASE_URL}${endpoint}`;
};

export const createOAuthUrl = (provider, endpoint = '') => {
  const baseUrl = ENV[provider.toUpperCase()]?.REDIRECT_URI || ENV.API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

export default ENV;
