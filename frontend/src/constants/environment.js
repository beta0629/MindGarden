/**
 * 환경 변수 및 설정 상수
 * 하드코딩된 URL과 설정값들을 환경변수로 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 환경 변수 기본값 설정
const ENV = {
  // API 기본 URL
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // OAuth2 설정
  KAKAO: {
    CLIENT_ID: process.env.REACT_APP_KAKAO_CLIENT_ID || 'cbb457cfb5f9351fd495be4af2b11a34',
    REDIRECT_URI: process.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback'
  },
  
  NAVER: {
    CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID || 'vTKNlxYKIfo1uCCXaDfk',
    CLIENT_SECRET: process.env.REACT_APP_NAVER_CLIENT_SECRET || 'V_b3omW5pu',
    REDIRECT_URI: process.env.REACT_APP_NAVER_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback'
  },
  
  GOOGLE: {
    CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id',
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback'
  },
  
  FACEBOOK: {
    CLIENT_ID: process.env.REACT_APP_FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
    REDIRECT_URI: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || 'http://localhost:8080/api/auth/oauth2/callback'
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
