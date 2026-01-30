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
                        const tenantId = refreshedUser.tenantId.trim();
                        // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                        if (tenantId === 'unknown' || tenantId === 'default' || 
                            tenantId.startsWith('unknown-') || tenantId.startsWith('default-') ||
                            tenantId === 'tenant-unknown' || tenantId === 'tenant-default') {
                            console.warn('⚠️ 기본값 tenantId 감지:', refreshedUser.tenantId);
                        } else {
                            // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                            console.log('✅ getTenantId: tenantId 발견 (refreshedUser):', refreshedUser.tenantId);
                            return refreshedUser.tenantId;
                        }
                        // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용 (위 조건을 통과한 경우에도 체크)
                        if (tenantId.startsWith('tenant-unknown-') || tenantId.startsWith('tenant-default-')) {
                            console.log('✅ getTenantId: tenantId 발견 (tenant-unknown-*):', refreshedUser.tenantId);
                            return refreshedUser.tenantId;
                        }
                    }
                } catch (refreshError) {
                    console.warn('⚠️ 세션 갱신 실패:', refreshError);
                }
            } else if (user && user.tenantId) {
                const tenantId = user.tenantId.trim();
                // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용 (우선 체크)
                if (tenantId.startsWith('tenant-unknown-') || tenantId.startsWith('tenant-default-')) {
                    console.log('✅ getTenantId: tenantId 발견 (tenant-unknown-*):', user.tenantId);
                    return user.tenantId;
                }
                // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                if (tenantId === 'unknown' || tenantId === 'default' || 
                    tenantId.startsWith('unknown-') || tenantId.startsWith('default-') ||
                    tenantId === 'tenant-unknown' || tenantId === 'tenant-default') {
                    console.warn('⚠️ 기본값 tenantId 감지, 세션 갱신 시도:', user.tenantId);
                    // 세션 갱신 시도 (비동기)
                    window.sessionManager.checkSession(true).catch(() => {});
                } else {
                    // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                    console.log('✅ getTenantId: tenantId 발견 (user):', user.tenantId);
                    return user.tenantId;
                }
            }
            
            const sessionInfo = window.sessionManager.getSessionInfo();
            if (sessionInfo && sessionInfo.tenantId) {
                const tenantId = sessionInfo.tenantId.trim();
                // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용 (우선 체크)
                if (tenantId.startsWith('tenant-unknown-') || tenantId.startsWith('tenant-default-')) {
                    console.log('✅ getTenantId: tenantId 발견 (sessionInfo, tenant-unknown-*):', sessionInfo.tenantId);
                    return sessionInfo.tenantId;
                }
                // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                if (tenantId !== 'unknown' && tenantId !== 'default' && 
                    !tenantId.startsWith('unknown-') && !tenantId.startsWith('default-') &&
                    tenantId !== 'tenant-unknown' && tenantId !== 'tenant-default') {
                    console.log('✅ getTenantId: tenantId 발견 (sessionInfo):', sessionInfo.tenantId);
                    return sessionInfo.tenantId;
                }
            }
        }
        
        // localStorage에서 사용자 정보 확인 (백업)
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user && user.tenantId) {
                const tenantId = user.tenantId.trim();
                // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용 (우선 체크)
                if (tenantId.startsWith('tenant-unknown-') || tenantId.startsWith('tenant-default-')) {
                    console.log('✅ getTenantId: tenantId 발견 (localStorage, tenant-unknown-*):', user.tenantId);
                    return user.tenantId;
                }
                // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                if (tenantId === 'unknown' || tenantId === 'default' || 
                    tenantId.startsWith('unknown-') || tenantId.startsWith('default-') ||
                    tenantId === 'tenant-unknown' || tenantId === 'tenant-default') {
                    console.warn('⚠️ localStorage의 기본값 tenantId 감지:', user.tenantId);
                    return null; // 기본값은 사용하지 않음
                }
                // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                console.log('✅ getTenantId: tenantId 발견 (localStorage):', user.tenantId);
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
            if (user && user.tenantId) {
                const userTenantId = user.tenantId.trim();
                // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                if (userTenantId !== 'unknown' && userTenantId !== 'default' && 
                    !userTenantId.startsWith('unknown-') && !userTenantId.startsWith('default-') &&
                    userTenantId !== 'tenant-unknown' && userTenantId !== 'tenant-default') {
                    tenantId = user.tenantId;
                } else if (userTenantId.startsWith('tenant-unknown-') || userTenantId.startsWith('tenant-default-')) {
                    // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                    tenantId = user.tenantId;
                }
            }
            
            // sessionInfo에서 확인
            if (!tenantId) {
                const sessionInfo = window.sessionManager.getSessionInfo();
                if (sessionInfo && sessionInfo.tenantId) {
                    const sessionTenantId = sessionInfo.tenantId.trim();
                    // 기본값 체크
                    if (sessionTenantId !== 'unknown' && sessionTenantId !== 'default' && 
                        !sessionTenantId.startsWith('unknown-') && !sessionTenantId.startsWith('default-') &&
                        sessionTenantId !== 'tenant-unknown' && sessionTenantId !== 'tenant-default') {
                        tenantId = sessionInfo.tenantId;
                    } else if (sessionTenantId.startsWith('tenant-unknown-') || sessionTenantId.startsWith('tenant-default-')) {
                        // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                        tenantId = sessionInfo.tenantId;
                    }
                }
            }
        }
        
        // 2. sessionManager에서 찾지 못했으면 localStorage에서 백업 시도
        if (!tenantId) {
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.tenantId) {
                        const storedTenantId = parsedUser.tenantId.trim();
                        // 기본값 체크
                        if (storedTenantId !== 'unknown' && storedTenantId !== 'default' && 
                            !storedTenantId.startsWith('unknown-') && !storedTenantId.startsWith('default-') &&
                            storedTenantId !== 'tenant-unknown' && storedTenantId !== 'tenant-default') {
                            tenantId = parsedUser.tenantId;
                            console.log('✅ localStorage에서 tenantId 발견:', tenantId);
                        } else if (storedTenantId.startsWith('tenant-unknown-') || storedTenantId.startsWith('tenant-default-')) {
                            // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
                            tenantId = parsedUser.tenantId;
                            console.log('✅ localStorage에서 tenantId 발견 (tenant-unknown-*):', tenantId);
                        }
                    }
                } catch (parseError) {
                    console.warn('⚠️ localStorage userInfo 파싱 오류:', parseError);
                }
            }
        }
        
        // 3. tenantId가 있으면 헤더에 추가 (단, 문자열인 경우만)
        if (tenantId && typeof tenantId === 'string') {
            headers['X-Tenant-Id'] = tenantId;
            console.log('✅ X-Tenant-Id 헤더 추가:', tenantId);
        } else if (tenantId) {
            // Promise나 다른 객체가 들어온 경우 경고
            console.warn('⚠️ tenantId가 문자열이 아님 (Promise 또는 객체):', typeof tenantId, tenantId);
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

