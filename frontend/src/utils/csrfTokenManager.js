/**
 * CSRF 토큰 관리 유틸리티
 * Spring Security CSRF 보호와 연동하여 토큰 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */

/**
 * CSRF 토큰을 쿠키에서 가져오기
 * 
 * @returns {string|null} CSRF 토큰 또는 null
 */
export const getCsrfToken = () => {
    try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }
        return null;
    } catch (error) {
        console.error('❌ CSRF 토큰 조회 실패:', error);
        return null;
    }
};

/**
 * CSRF 토큰을 헤더에 설정
 * 
 * @param {object} headers - 요청 헤더 객체
 * @returns {object} CSRF 토큰이 추가된 헤더
 */
export const addCsrfTokenToHeaders = (headers = {}) => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
        console.log('🔒 CSRF 토큰 헤더 추가됨');
    } else {
        console.warn('⚠️ CSRF 토큰을 찾을 수 없습니다.');
    }
    return headers;
};

/**
 * POST/PUT/DELETE 요청에 CSRF 토큰 자동 추가
 * 
 * @param {string} url - 요청 URL
 * @param {object} options - fetch 옵션
 * @returns {Promise<Response>} fetch 응답
 */
export const fetchWithCsrf = async (url, options = {}) => {
    const method = options.method?.toUpperCase();
    
    // CSRF 보호가 필요한 메서드인지 확인
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        options.headers = addCsrfTokenToHeaders(options.headers);
    }
    
    try {
        const response = await fetch(url, options);
        
        // CSRF 오류 처리
        if (response.status === 403 && response.headers.get('content-type')?.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.message?.includes('CSRF') || errorData.message?.includes('csrf')) {
                console.error('❌ CSRF 토큰 오류:', errorData.message);
                // 토큰 갱신 후 재시도
                await refreshCsrfToken();
                return fetchWithCsrf(url, options);
            }
        }
        
        return response;
    } catch (error) {
        console.error('❌ CSRF 포함 요청 실패:', error);
        throw error;
    }
};

/**
 * CSRF 토큰 갱신
 * 
 * @returns {Promise<boolean>} 갱신 성공 여부
 */
export const refreshCsrfToken = async () => {
    try {
        console.log('🔄 CSRF 토큰 갱신 시도');
        
        // CSRF 토큰 요청 (GET 요청으로 토큰 갱신)
        const response = await fetch('/api/auth/csrf-token', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ CSRF 토큰 갱신 성공');
            return true;
        } else {
            console.warn('⚠️ CSRF 토큰 갱신 실패:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ CSRF 토큰 갱신 오류:', error);
        return false;
    }
};

/**
 * CSRF 토큰 상태 확인
 * 
 * @returns {boolean} 토큰 존재 여부
 */
export const hasValidCsrfToken = () => {
    const token = getCsrfToken();
    return token !== null && token.length > 0;
};

/**
 * CSRF 토큰 초기화
 * 페이지 로드 시 자동으로 CSRF 토큰 확인 및 갱신
 */
export const initializeCsrfToken = async () => {
    try {
        console.log('🔒 CSRF 토큰 초기화 시작');
        
        if (!hasValidCsrfToken()) {
            console.log('🔄 CSRF 토큰이 없어 갱신 시도');
            await refreshCsrfToken();
        } else {
            console.log('✅ CSRF 토큰이 이미 존재함');
        }
    } catch (error) {
        console.error('❌ CSRF 토큰 초기화 실패:', error);
    }
};

/**
 * CSRF 토큰 디버깅 정보 출력
 */
export const debugCsrfToken = () => {
    const token = getCsrfToken();
    console.group('🔒 CSRF 토큰 디버깅 정보');
    console.log('토큰 존재 여부:', hasValidCsrfToken());
    console.log('토큰 값:', token ? `${token.substring(0, 10)}...` : 'null');
    console.log('쿠키 정보:', document.cookie);
    console.groupEnd();
};

export default {
    getCsrfToken,
    addCsrfTokenToHeaders,
    fetchWithCsrf,
    refreshCsrfToken,
    hasValidCsrfToken,
    initializeCsrfToken,
    debugCsrfToken
};
