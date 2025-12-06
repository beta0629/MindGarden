/**
 * API 헤더 유틸리티
 * 모든 API 호출에 공통으로 적용되는 헤더를 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-06
 */

/**
 * tenantId 헤더 가져오기 (공통 함수)
 * @param {boolean} forceRefresh 세션 강제 갱신 여부
 * @returns {string|null} tenantId 또는 null
 */
export const getTenantId = async (forceRefresh = false) => {
    try {
        // sessionManager가 있으면 우선 사용 (최신 정보)
        if (typeof window !== 'undefined' && window.sessionManager) {
            // 세션이 없거나 강제 갱신이 요청된 경우 세션 체크
            const user = window.sessionManager.getUser();
            if (!user || !user.tenantId || forceRefresh) {
                // 세션 강제 갱신 시도
                try {
                    await window.sessionManager.checkSession(true);
                    const refreshedUser = window.sessionManager.getUser();
                    if (refreshedUser && refreshedUser.tenantId) {
                        // 기본값/더미 값 체크
                        if (refreshedUser.tenantId.includes('unknown') || refreshedUser.tenantId.includes('default')) {
                            console.warn('⚠️ 기본값 tenantId 감지:', refreshedUser.tenantId);
                        } else {
                            return refreshedUser.tenantId;
                        }
                    }
                } catch (refreshError) {
                    console.warn('⚠️ 세션 갱신 실패:', refreshError);
                }
            } else if (user && user.tenantId) {
                // 기본값/더미 값 체크
                if (user.tenantId.includes('unknown') || user.tenantId.includes('default')) {
                    console.warn('⚠️ 기본값 tenantId 감지, 세션 갱신 시도:', user.tenantId);
                    // 세션 갱신 시도 (비동기)
                    window.sessionManager.checkSession(true).catch(() => {});
                } else {
                    return user.tenantId;
                }
            }
            
            const sessionInfo = window.sessionManager.getSessionInfo();
            if (sessionInfo && sessionInfo.tenantId) {
                if (!sessionInfo.tenantId.includes('unknown') && !sessionInfo.tenantId.includes('default')) {
                    return sessionInfo.tenantId;
                }
            }
        }
        
        // localStorage에서 사용자 정보 확인 (백업)
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user && user.tenantId) {
                // 기본값/더미 값 체크
                if (user.tenantId.includes('unknown') || user.tenantId.includes('default')) {
                    console.warn('⚠️ localStorage의 기본값 tenantId 감지:', user.tenantId);
                    return null; // 기본값은 사용하지 않음
                }
                return user.tenantId;
            }
        }
        
        console.warn('⚠️ tenantId를 찾을 수 없음');
    } catch (error) {
        console.error('❌ tenantId를 가져오는 중 오류:', error);
    }
    return null;
};

/**
 * 기본 API 헤더 생성 (동기 버전 - 빠른 응답 필요 시)
 * @param {Object} additionalHeaders 추가 헤더
 * @returns {Object} 헤더 객체
 */
export const getDefaultApiHeaders = (additionalHeaders = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...additionalHeaders
    };
    
    // tenantId 헤더 추가 (동기 방식 - sessionManager에서 즉시 가져오기)
    try {
        let tenantId = null;
        
        // 1. sessionManager에서 우선 확인
        if (typeof window !== 'undefined' && window.sessionManager) {
            const user = window.sessionManager.getUser();
            if (user && user.tenantId && !user.tenantId.includes('unknown') && !user.tenantId.includes('default')) {
                tenantId = user.tenantId;
            } else {
                // sessionInfo에서 확인
                const sessionInfo = window.sessionManager.getSessionInfo();
                if (sessionInfo && sessionInfo.tenantId && !sessionInfo.tenantId.includes('unknown') && !sessionInfo.tenantId.includes('default')) {
                    tenantId = sessionInfo.tenantId;
                }
            }
        }
        
        // 2. sessionManager에서 찾지 못했으면 localStorage에서 백업 시도
        if (!tenantId) {
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.tenantId && !parsedUser.tenantId.includes('unknown') && !parsedUser.tenantId.includes('default')) {
                        tenantId = parsedUser.tenantId;
                        console.log('✅ localStorage에서 tenantId 발견:', tenantId);
                    }
                } catch (parseError) {
                    console.warn('⚠️ localStorage userInfo 파싱 오류:', parseError);
                }
            }
        }
        
        // 3. tenantId가 있으면 헤더에 추가
        if (tenantId) {
            headers['X-Tenant-Id'] = tenantId;
            console.log('✅ X-Tenant-Id 헤더 추가:', tenantId);
        } else {
            console.warn('⚠️ tenantId를 찾을 수 없어 헤더에 포함하지 않음');
        }
    } catch (error) {
        console.error('❌ tenantId 헤더 추가 중 오류:', error);
    }
    
    return headers;
};

/**
 * 기본 API 헤더 생성 (비동기 버전 - 세션 갱신 필요 시)
 * @param {Object} additionalHeaders 추가 헤더
 * @param {boolean} forceRefresh 세션 강제 갱신 여부
 * @returns {Promise<Object>} 헤더 객체
 */
export const getDefaultApiHeadersAsync = async (additionalHeaders = {}, forceRefresh = false) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...additionalHeaders
    };
    
    // tenantId 헤더 추가 (비동기 방식 - 세션 갱신 가능)
    const tenantId = await getTenantId(forceRefresh);
    if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
    }
    
    return headers;
};

/**
 * CSRF 토큰 포함 기본 헤더 생성
 * @param {string} csrfToken CSRF 토큰
 * @param {Object} additionalHeaders 추가 헤더
 * @returns {Object} 헤더 객체
 */
export const getDefaultApiHeadersWithCsrf = (csrfToken, additionalHeaders = {}) => {
    const headers = getDefaultApiHeaders(additionalHeaders);
    
    if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
    }
    
    return headers;
};

