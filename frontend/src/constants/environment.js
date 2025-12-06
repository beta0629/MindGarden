/**
 * 환경 변수 및 설정 상수
/**
 * 하드코딩된 URL과 설정값들을 환경변수로 관리
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

// 현재 환경에 따른 동적 URL 생성
const getBaseUrl = () => {
  // 환경변수가 있으면 사용
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('🔧 API_BASE_URL from env:', process.env.REACT_APP_API_BASE_URL);
    const envUrl = process.env.REACT_APP_API_BASE_URL.trim();
    // 빈 문자열이면 상대 경로 사용
    if (envUrl === '' || envUrl === '""' || envUrl === "''") {
      console.log('🔧 환경변수가 빈 문자열 - 상대 경로 사용');
      return '';
    }
    return envUrl;
  }
  
  // 운영 환경에서는 Nginx 프록시를 사용하므로 상대 경로 사용
  // Nginx가 /api 경로를 백엔드로 프록시하므로 빈 문자열 반환
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 프로덕션 환경: Nginx 프록시 사용 (상대 경로)');
    return '';
  }
  
  // 개발 환경에서는 백엔드 직접 연결 (프록시 문제 방지)
  console.log('🔧 개발 환경: 백엔드 직접 연결 (8080 포트)');
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

// 환경 변수 기본값 설정
const ENV = {
  // API 기본 URL (동적 생성)
  API_BASE_URL: getBaseUrl(),
  FRONTEND_URL: getFrontendUrl(),
  
  // OAuth2 설정 (동적 생성)
  KAKAO: {
    CLIENT_ID: process.env.REACT_APP_KAKAO_CLIENT_ID || 'cbb457cfb5f9351fd495be4af2b11a34',
    REDIRECT_URI: process.env.REACT_APP_KAKAO_REDIRECT_URI || `${getBaseUrl()}/api/v1/auth/kakao/callback`
  },
  
  NAVER: {
    CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID || 'vTKNlxYKIfo1uCCXaDfk',
    CLIENT_SECRET: process.env.REACT_APP_NAVER_CLIENT_SECRET || 'V_b3omW5pu',
    REDIRECT_URI: process.env.REACT_APP_NAVER_REDIRECT_URI || `${getBaseUrl()}/api/v1/auth/naver/callback`
  },
  
  GOOGLE: {
    CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id',
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/v1/auth/google/callback`
  },
  
  FACEBOOK: {
    CLIENT_ID: process.env.REACT_APP_FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
    REDIRECT_URI: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || `${getBaseUrl()}/api/v1/auth/facebook/callback`
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
