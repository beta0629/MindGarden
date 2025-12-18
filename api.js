/**
 * 코어솔루션 API 서비스
 * API 호출 및 데이터 관리
 */

class ApiService {
    constructor(config) {
        this.baseURL = config.API_BASE_URL;
        this.endpoints = config.ENDPOINTS;
        this.timeout = config.TIMEOUT;
    }

    /**
     * 기본 fetch 래퍼 (에러 처리 및 타임아웃)
     */
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * 홈페이지 메인 데이터 조회
     */
    async getHomeData() {
        try {
            const url = `${this.baseURL}${this.endpoints.HOME_DATA}`;
            return await this.request(url);
        } catch (error) {
            console.error('Failed to fetch home data:', error);
            // 오류 시 기본 데이터 반환
            return this.getDefaultHomeData();
        }
    }

    /**
     * 갤러리 이미지 조회
     */
    async getGalleryImages() {
        try {
            const url = `${this.baseURL}${this.endpoints.GALLERY}`;
            const data = await this.request(url);
            return data.images || [];
        } catch (error) {
            console.error('Failed to fetch gallery images:', error);
            return [];
        }
    }

    /**
     * 상담소 정보 조회
     */
    async getClinicInfo() {
        try {
            const url = `${this.baseURL}${this.endpoints.CLINIC_INFO}`;
            return await this.request(url);
        } catch (error) {
            console.error('Failed to fetch clinic info:', error);
            return null;
        }
    }

    /**
     * 공지사항 조회
     */
    async getNotices(limit = 5) {
        try {
            const url = `${this.baseURL}${this.endpoints.NOTICES}?limit=${limit}`;
            const data = await this.request(url);
            return data.notices || [];
        } catch (error) {
            console.error('Failed to fetch notices:', error);
            return [];
        }
    }

    /**
     * 프로그램 정보 조회
     */
    async getPrograms() {
        try {
            const url = `${this.baseURL}${this.endpoints.PROGRAMS}`;
            const data = await this.request(url);
            return data.programs || [];
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            return [];
        }
    }

    /**
     * 기본 홈 데이터 (API 실패 시 사용)
     */
    getDefaultHomeData() {
        return {
            slogan: {
                sub: '새로운 희망이 시작되는 곳',
                main: '당신의 하루가\n더 맑아지도록'
            },
            gallery: [
                { url: 'assets/images/gallery_1.png', alt: 'Gallery Image 1' },
                { url: 'assets/images/gallery_2.png', alt: 'Gallery Image 2' },
                { url: 'assets/images/gallery_3.png', alt: 'Gallery Image 3' },
                { url: 'assets/images/gallery_4.png', alt: 'Gallery Image 4' }
            ]
        };
    }
}

// 싱글톤 인스턴스 생성
let apiServiceInstance = null;

function getApiService() {
    if (!apiServiceInstance) {
        if (typeof CONFIG === 'undefined') {
            console.warn('CONFIG is not defined. Using default configuration.');
            // 기본 설정으로 폴백
            apiServiceInstance = new ApiService({
                API_BASE_URL: 'https://api.mindgarden.co.kr',
                ENDPOINTS: {
                    HOME_DATA: '/api/v1/home',
                    GALLERY: '/api/v1/gallery',
                    CLINIC_INFO: '/api/v1/clinic/info',
                    NOTICES: '/api/v1/notices',
                    PROGRAMS: '/api/v1/programs'
                },
                TIMEOUT: 10000
            });
        } else {
            apiServiceInstance = new ApiService(CONFIG);
        }
    }
    return apiServiceInstance;
}

