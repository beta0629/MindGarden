/**
 * 코어솔루션 API 설정
 * 환경 변수나 설정 파일을 통해 관리
 */

// 환경 변수에서 API URL 가져오기 (브라우저 환경에서는 window 환경 변수 사용)
// 실제 배포 시에는 빌드 도구나 서버에서 주입
const getApiBaseUrl = () => {
    // 1. window 환경 변수 확인 (빌드 시 주입)
    if (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) {
        return window.ENV.API_BASE_URL;
    }
    // 2. 기본값 (프로덕션)
    return 'https://api.mindgarden.co.kr';
    // 3. 개발 서버 사용 시 아래 주석 해제
    // return 'http://beta0629.cafe24.com:8080';
};

const CONFIG = {
    // API 기본 URL (환경에 따라 변경)
    API_BASE_URL: getApiBaseUrl(),
    
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
        PROGRAMS: '/api/v1/programs'
    },
    
    // 요청 타임아웃 (ms)
    TIMEOUT: 10000,
    
    // 재시도 설정
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000
    }
};

// 전역으로 노출 (필요시)
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

