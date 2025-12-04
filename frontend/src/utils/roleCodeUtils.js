/**
 * 역할 코드 공통코드 조회 유틸리티
 * 역할 코드를 공통코드에서 동적으로 조회하여 하드코딩 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-04
 */

import { getCommonCodes } from './commonCodeApi';

// 역할 코드 캐시
const roleCodeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

/**
 * 공통코드에서 역할 코드 목록 조회
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
 * @returns {Promise<Array>} 역할 코드 목록
 */
export const getRoleCodesFromCommonCode = async (useCache = true) => {
    try {
        // 캐시 확인
        if (useCache && roleCodeCache.has('roles')) {
            const cached = roleCodeCache.get('roles');
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }

        // 공통코드에서 역할 조회 (USER_ROLE 또는 ROLE 그룹)
        let roleCodes = [];
        
        // USER_ROLE 그룹 시도
        try {
            roleCodes = await getCommonCodes('USER_ROLE');
        } catch (e) {
            console.warn('USER_ROLE 그룹 조회 실패, ROLE 그룹 시도:', e);
        }

        // ROLE 그룹 시도 (USER_ROLE이 없을 경우)
        if (!roleCodes || roleCodes.length === 0) {
            try {
                roleCodes = await getCommonCodes('ROLE');
            } catch (e) {
                console.warn('ROLE 그룹 조회 실패:', e);
            }
        }

        // 캐시에 저장
        if (useCache && roleCodes && roleCodes.length > 0) {
            roleCodeCache.set('roles', {
                data: roleCodes,
                timestamp: Date.now()
            });
        }

        return roleCodes || [];
    } catch (error) {
        console.error('역할 코드 조회 실패:', error);
        return [];
    }
};

/**
 * 특정 역할 코드가 존재하는지 확인
 * @param {string} roleCode - 확인할 역할 코드
 * @returns {Promise<boolean>} 존재 여부
 */
export const hasRoleCode = async (roleCode) => {
    try {
        const roleCodes = await getRoleCodesFromCommonCode();
        return roleCodes.some(code => 
            code.codeValue === roleCode || 
            code.codeValue === roleCode.toUpperCase()
        );
    } catch (error) {
        console.error('역할 코드 확인 실패:', error);
        return false;
    }
};

/**
 * 역할 코드의 한글명 조회
 * @param {string} roleCode - 역할 코드
 * @returns {Promise<string>} 한글명
 */
export const getRoleKoreanName = async (roleCode) => {
    try {
        const roleCodes = await getRoleCodesFromCommonCode();
        const role = roleCodes.find(code => 
            code.codeValue === roleCode || 
            code.codeValue === roleCode.toUpperCase()
        );
        return role ? (role.koreanName || role.codeLabel || roleCode) : roleCode;
    } catch (error) {
        console.error('역할 한글명 조회 실패:', error);
        return roleCode;
    }
};

/**
 * 관리자 역할 코드 목록 조회 (공통코드 기반)
 * @returns {Promise<Array<string>>} 관리자 역할 코드 목록
 */
export const getAdminRoleCodes = async () => {
    try {
        const roleCodes = await getRoleCodesFromCommonCode();
        // extraData에서 권한 레벨 확인하거나, 코드명으로 판단
        return roleCodes
            .filter(code => {
                const codeValue = code.codeValue || '';
                const extraData = code.extraData ? 
                    (typeof code.extraData === 'string' ? JSON.parse(code.extraData) : code.extraData) : 
                    {};
                
                // extraData에 권한 레벨이 있으면 사용
                if (extraData.permissionLevel) {
                    return extraData.permissionLevel >= 3; // 관리자 레벨
                }
                
                // 코드명으로 판단 (하위 호환성)
                return codeValue.includes('ADMIN') || 
                       codeValue.includes('HQ') || 
                       codeValue.includes('MANAGER') ||
                       codeValue === 'ADMIN';
            })
            .map(code => code.codeValue);
    } catch (error) {
        console.error('관리자 역할 코드 조회 실패:', error);
        // 폴백: 기본 관리자 역할
        return ['ADMIN', 'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'];
    }
};


/**
 * 역할 코드 캐시 초기화
 */
export const clearRoleCodeCache = () => {
    roleCodeCache.clear();
};

