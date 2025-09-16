/**
 * 사용자 역할 관련 헬퍼 유틸리티
 * 백엔드에서 동적으로 역할 정보를 로드하여 사용
 */

let roleDataCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

/**
 * 백엔드에서 역할 정보를 로드
 */
const loadRoleData = async () => {
    try {
        // 캐시 확인
        if (roleDataCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            console.log('🎭 역할 정보 캐시 사용');
            return roleDataCache;
        }

        console.log('🎭 역할 정보 로딩 시작');
        const response = await fetch('/api/admin/user-roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`역할 정보 로드 실패: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
            roleDataCache = result.data;
            lastFetchTime = Date.now();
            console.log('✅ 역할 정보 로딩 완료:', Object.keys(roleDataCache).length, '개 역할');
            return roleDataCache;
        } else {
            throw new Error('역할 정보 응답 형식 오류');
        }
    } catch (error) {
        console.error('❌ 역할 정보 로딩 실패:', error);
        return getFallbackRoleData();
    }
};

/**
 * Fallback 역할 데이터 (API 실패 시 사용)
 */
const getFallbackRoleData = () => {
    return {
        'CLIENT': { displayName: '내담자', displayNameEn: 'Client' },
        'CONSULTANT': { displayName: '상담사', displayNameEn: 'Consultant' },
        'ADMIN': { displayName: '지점관리자', displayNameEn: 'Admin' },
        'BRANCH_SUPER_ADMIN': { displayName: '본점수퍼어드민', displayNameEn: 'Branch Super Admin' },
        'BRANCH_MANAGER': { displayName: '지점장', displayNameEn: 'Branch Manager' },
        'HQ_ADMIN': { displayName: '헤드쿼터어드민', displayNameEn: 'HQ Admin' },
        'SUPER_HQ_ADMIN': { displayName: '본사고급관리자', displayNameEn: 'Super HQ Admin' },
        'HQ_MASTER': { displayName: '본사총관리자', displayNameEn: 'HQ Master' },
        'HQ_SUPER_ADMIN': { displayName: '본사최고관리자', displayNameEn: 'HQ Super Admin' }
    };
};

/**
 * 역할의 한국어 표시명 가져오기
 */
export const getRoleDisplayName = async (role, branchName = null) => {
    try {
        const roleData = await loadRoleData();
        const roleInfo = roleData[role];
        
        if (roleInfo && roleInfo.displayName) {
            // 지점 정보가 있는 경우 추가
            if (branchName && (role === 'ADMIN' || role === 'BRANCH_MANAGER' || role === 'BRANCH_SUPER_ADMIN')) {
                return `${roleInfo.displayName} (${branchName})`;
            }
            return roleInfo.displayName;
        }
        
        return role; // Fallback
    } catch (error) {
        console.error('❌ 역할 표시명 조회 실패:', error);
        return role;
    }
};

/**
 * 역할의 영문 표시명 가져오기
 */
export const getRoleDisplayNameEn = async (role, branchName = null) => {
    try {
        const roleData = await loadRoleData();
        const roleInfo = roleData[role];
        
        if (roleInfo && roleInfo.displayNameEn) {
            // 지점 정보가 있는 경우 추가
            if (branchName && (role === 'ADMIN' || role === 'BRANCH_MANAGER' || role === 'BRANCH_SUPER_ADMIN')) {
                return `${roleInfo.displayNameEn} (${branchName})`;
            }
            return roleInfo.displayNameEn;
        }
        
        return role; // Fallback
    } catch (error) {
        console.error('❌ 역할 영문 표시명 조회 실패:', error);
        return role;
    }
};

/**
 * 모든 역할 정보 가져오기
 */
export const getAllRoles = async () => {
    try {
        return await loadRoleData();
    } catch (error) {
        console.error('❌ 전체 역할 정보 조회 실패:', error);
        return getFallbackRoleData();
    }
};

/**
 * 역할 캐시 강제 새로고침
 */
export const refreshRoleCache = () => {
    roleDataCache = null;
    lastFetchTime = null;
    console.log('🎭 역할 정보 캐시 초기화');
};

/**
 * 디버그용 역할 정보 출력
 */
export const debugRoleData = async () => {
    if (process.env.NODE_ENV === 'development') {
        const roleData = await loadRoleData();
        console.log('🎭 디버그 - 역할 정보:', roleData);
        return roleData;
    }
};
