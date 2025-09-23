/**
 * 환경 변수 및 설정 상수
 * 하드코딩된 URL과 설정값들을 환경변수로 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 현재 환경에 따른 동적 URL 생성
const getBaseUrl = () => {
  // 환경변수가 있으면 사용
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 운영 환경에서는 현재 도메인 사용
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // 개발 환경에서는 프록시를 통해 상대 경로 사용
  return '';
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

// 환경 변수 기본값 설정
const ENV = {
  // API 기본 URL (동적 생성)
  API_BASE_URL: getBaseUrl(),
  FRONTEND_URL: getFrontendUrl(),
  
  // OAuth2 설정 (동적 생성)
  KAKAO: {
    CLIENT_ID: process.env.REACT_APP_KAKAO_CLIENT_ID || 'cbb457cfb5f9351fd495be4af2b11a34',
    REDIRECT_URI: process.env.REACT_APP_KAKAO_REDIRECT_URI || `${getBaseUrl()}/api/auth/kakao/callback`
  },
  
  NAVER: {
    CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID || 'vTKNlxYKIfo1uCCXaDfk',
    CLIENT_SECRET: process.env.REACT_APP_NAVER_CLIENT_SECRET || 'V_b3omW5pu',
    REDIRECT_URI: process.env.REACT_APP_NAVER_REDIRECT_URI || `${getBaseUrl()}/api/auth/naver/callback`
  },
  
  GOOGLE: {
    CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id',
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/auth/google/callback`
  },
  
  FACEBOOK: {
    CLIENT_ID: process.env.REACT_APP_FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
    REDIRECT_URI: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || `${getBaseUrl()}/api/auth/facebook/callback`
  }
};

// API 엔드포인트 URL 생성 헬퍼
export const createApiUrl = (endpoint) => {
  return `${ENV.API_BASE_URL}${endpoint}`;
};

// OAuth2 URL 생성 헬퍼
export const createOAuthUrl = (provider, endpoint = '') => {
  const baseUrl = ENV[provider.toUpperCase()]?.REDIRECT_URI || ENV.API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// 환경 변수 내보내기
export default ENV;
