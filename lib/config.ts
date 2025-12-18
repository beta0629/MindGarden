/**
 * 코어솔루션 API 설정
 * Next.js 환경 변수 사용
 */

export const CONFIG = {
  // API 기본 URL (환경 변수에서 가져오기)
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://api.mindgarden.co.kr',
  
  // 로컬 개발 서버 포트 (환경 변수에서 가져오기)
  LOCAL_PORT: parseInt(process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000', 10),
  
  // 로컬 개발 서버 URL
  LOCAL_URL: process.env.NEXT_PUBLIC_SITE_URL || 
             (process.env.NODE_ENV === 'development' 
               ? `http://localhost:${parseInt(process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000', 10)}`
               : undefined),
  
  // API 엔드포인트
  ENDPOINTS: {
    // 홈페이지 데이터 조회
    HOME_DATA: '/api/v1/home',
    
    // 갤러리 이미지 조회
    GALLERY: '/api/v1/gallery',
    
    // 상담소 정보 조회
    CLINIC_INFO: '/api/v1/clinic/info',
    
    // 공지사항
    NOTICES: '/api/v1/notices',
    
    // 프로그램 정보
    PROGRAMS: '/api/v1/programs',
    
    // 블로그
    BLOG_POSTS: '/api/v1/blog/posts',
    BLOG_POST: '/api/v1/blog/posts',
    BLOG_IMAGES: '/api/v1/blog/images'
  },
  
  // 요청 타임아웃 (ms)
  TIMEOUT: 10000,
  
  // 재시도 설정
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000
  }
};

