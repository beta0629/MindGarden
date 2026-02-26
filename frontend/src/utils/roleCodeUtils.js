/**
 * 역할 코드 공통코드 조회 유틸리티
/**
 * 역할 코드를 공통코드에서 동적으로 조회하여 하드코딩 방지
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-12-04
 */

import { getCommonCodes } from './commonCodeApi';

// 역할 코드 캐시
const roleCodeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

/**
 * 공통코드에서 역할 코드 목록 조회
/**
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
/**
 * @returns {Promise<Array>} 역할 코드 목록
 */
const ALLOWED_ROLES = ['ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT'];

const filterToAllowedRoles = (list) => (list || []).filter(
    code => code && code.codeValue && ALLOWED_ROLES.includes(code.codeValue)
);

export const getRoleCodesFromCommonCode = async (useCache = true) => {
    try {
        if (useCache && roleCodeCache.has('roles')) {
            const cached = roleCodeCache.get('roles');
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return filterToAllowedRoles(cached.data);
            }
        }
        let roleCodes = [];

        try {
            roleCodes = await getCommonCodes('ROLE');
        } catch (e) {
            console.warn('ROLE 그룹 조회 실패:', e);
        }

        const filtered = filterToAllowedRoles(roleCodes);

        if (useCache && filtered.length > 0) {
            roleCodeCache.set('roles', { data: filtered, timestamp: Date.now() });
        }

        return filtered;
    } catch (error) {
        console.error('역할 코드 조회 실패:', error);
        return [];
    }
};

/**
 * 특정 역할 코드가 존재하는지 확인
/**
 * @param {string} roleCode - 확인할 역할 코드
/**
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
/**
 * @param {string} roleCode - 역할 코드
/**
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
/**
 * @returns {Promise<Array<string>>} 관리자 역할 코드 목록
 */
/** 관리자 역할은 ADMIN만 (4역할 단순화) */
export const getAdminRoleCodes = async () => {
    try {
        const roleCodes = await getRoleCodesFromCommonCode();
        return roleCodes
            .filter(code => (code.codeValue || '') === 'ADMIN')
            .map(code => code.codeValue);
    } catch (error) {
        console.error('관리자 역할 코드 조회 실패:', error);
        return ['ADMIN'];
    }
};


/**
 * 역할 코드 캐시 초기화
 */
export const clearRoleCodeCache = () => {
    roleCodeCache.clear();
};

