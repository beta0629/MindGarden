/**
 * API 호출 캐싱 유틸리티
/**
 * Rate Limiting 문제 해결을 위한 캐시 시스템
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-01-17
 */

class ApiCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5분 기본 TTL
    }

/**
     * 캐시에서 데이터 조회
/**
     * @param {string} key - 캐시 키
/**
     * @returns {any|null} - 캐시된 데이터 또는 null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // TTL 확인
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

/**
     * 캐시에 데이터 저장
/**
     * @param {string} key - 캐시 키
/**
     * @param {any} data - 저장할 데이터
/**
     * @param {number} ttl - TTL (밀리초), 기본값 5분
     */
    set(key, data, ttl = this.defaultTTL) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl
        });
    }

/**
     * 캐시 삭제
/**
     * @param {string} key - 캐시 키
     */
    delete(key) {
        this.cache.delete(key);
    }

/**
     * 특정 패턴의 캐시 삭제
/**
     * @param {string} pattern - 삭제할 패턴 (정규식)
     */
    deletePattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

/**
     * 모든 캐시 삭제
     */
    clear() {
        this.cache.clear();
    }

/**
     * 캐시 크기 반환
/**
     * @returns {number} - 캐시 항목 수
     */
    size() {
        return this.cache.size;
    }
}

// 전역 캐시 인스턴스
const apiCache = new ApiCache();

/**
 * 캐시된 API 호출 함수
/**
 * @param {string} url - API URL
/**
 * @param {Object} options - fetch 옵션
/**
 * @param {number} ttl - 캐시 TTL (밀리초)
/**
 * @returns {Promise<any>} - API 응답 데이터
 */
export async function cachedApiCall(url, options = {}, ttl = 5 * 60 * 1000) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // 캐시에서 조회
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
        console.log(`📦 캐시에서 조회: ${url}`);
        return cachedData;
    }

    try {
        // API 호출
        console.log(`🌐 API 호출: ${url}`);
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 캐시에 저장
        apiCache.set(cacheKey, data, ttl);
        console.log(`💾 캐시에 저장: ${url}`);
        
        return data;
    } catch (error) {
        console.error(`❌ API 호출 실패: ${url}`, error);
        throw error;
    }
}

/**
 * 특정 API 캐시 무효화
/**
 * @param {string} url - API URL
/**
 * @param {Object} options - fetch 옵션
 */
export function invalidateCache(url, options = {}) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    apiCache.delete(cacheKey);
    console.log(`🗑️ 캐시 무효화: ${url}`);
}

/**
 * 패턴별 캐시 무효화
/**
 * @param {string} pattern - 무효화할 패턴
 */
export function invalidateCachePattern(pattern) {
    apiCache.deletePattern(pattern);
    console.log(`🗑️ 패턴별 캐시 무효화: ${pattern}`);
}

/**
 * 모든 캐시 무효화
 */
export function clearAllCache() {
    apiCache.clear();
    console.log(`🗑️ 모든 캐시 무효화`);
}

// 캐시 설정 상수
export const CACHE_TTL = {
    SHORT: 1 * 60 * 1000,    // 1분
    MEDIUM: 5 * 60 * 1000,   // 5분
    LONG: 15 * 60 * 1000,    // 15분
    VERY_LONG: 60 * 60 * 1000 // 1시간
};

// 자주 사용되는 API들의 캐시 설정
export const CACHE_CONFIG = {
    // 메뉴 구조 - 15분 캐시
    MENU_STRUCTURE: { ttl: CACHE_TTL.LONG },
    // OAuth2 설정 - 1시간 캐시
    OAUTH2_CONFIG: { ttl: CACHE_TTL.VERY_LONG },
    // 공통 코드 - 1시간 캐시
    COMMON_CODES: { ttl: CACHE_TTL.VERY_LONG },
    // 사용자 정보 - 5분 캐시
    USER_INFO: { ttl: CACHE_TTL.MEDIUM },
    // 대시보드 데이터 - 1분 캐시
    DASHBOARD: { ttl: CACHE_TTL.SHORT }
};

export default apiCache;
