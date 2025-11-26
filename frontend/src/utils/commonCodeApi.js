/**
 * 공통코드 표준화된 API 유틸리티
 * 표준화된 RESTful API 사용
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import { apiGet, apiPost, apiPut, apiDelete } from './ajax';

const API_BASE = '/api/v1/common-codes';

/**
 * 테넌트별 독립 코드 그룹 목록
 * 이 코드 그룹들은 테넌트별로 완전히 독립적으로 관리되어야 함
 */
const TENANT_ISOLATED_CODE_GROUPS = [
    'CONSULTATION_PACKAGE',
    'PACKAGE_TYPE',
    'PAYMENT_METHOD',
    'SPECIALTY',
    'CONSULTATION_TYPE',
    'MAPPING_STATUS',
    'RESPONSIBILITY',
    'VACATION_TYPE',
    'MESSAGE_TYPE',
    'PRIORITY',
    'COMPLETION_STATUS',
    'FINANCIAL_CATEGORY',
    'TAX_CATEGORY',
    'BUDGET_CATEGORY',
    'ITEM_CATEGORY',
    'SALARY_TYPE',
    'SALARY_OPTION_TYPE',
    'SALARY_PAY_DAY'
];

/**
 * 코어 코드 그룹 목록 (시스템 전역)
 */
const CORE_CODE_GROUPS = [
    'USER_STATUS',
    'USER_ROLE',
    'ROLE',
    'CODE_GROUP_TYPE',
    'SYSTEM_STATUS',
    'NOTIFICATION_TYPE',
    'GENDER',
    'BANK',
    'ADDRESS_TYPE'
];

/**
 * 공통코드 목록 조회
 * @param {string} codeGroup - 코드 그룹 (선택)
 * @param {boolean} forceTenant - 테넌트 코드만 조회 (기본값: 자동 판단)
 * @returns {Promise<Array>} 공통코드 목록
 */
export const getCommonCodes = async (codeGroup = null, forceTenant = null) => {
    try {
        // forceTenant가 명시되지 않았으면 코드 그룹 타입에 따라 자동 판단
        let useTenantApi = forceTenant;
        if (useTenantApi === null && codeGroup) {
            useTenantApi = TENANT_ISOLATED_CODE_GROUPS.includes(codeGroup);
        }
        
        let url;
        if (useTenantApi) {
            // 테넌트 코드 전용 API (코어 코드 폴백 없음 - 독립성 보장)
            url = codeGroup ? `${API_BASE}/tenant?codeGroup=${codeGroup}` : `${API_BASE}/tenant`;
        } else if (codeGroup && CORE_CODE_GROUPS.includes(codeGroup)) {
            // 코어 코드 전용 API
            url = `${API_BASE}/core/groups/${codeGroup}`;
        } else {
            // 통합 조회 API (하위 호환성 - 시스템 전역 코드에만 사용)
            url = codeGroup ? `${API_BASE}?codeGroup=${codeGroup}` : API_BASE;
        }
        
        const response = await apiGet(url);
        
        if (response.success && response.data) {
            return response.data.codes || [];
        }
        
        // 하위 호환성: 기존 API 형식 지원
        if (Array.isArray(response)) {
            return response;
        }
        
        return [];
    } catch (error) {
        console.error('공통코드 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 테넌트 코드 전용 조회 (독립성 보장)
 * @param {string} codeGroup - 코드 그룹
 * @returns {Promise<Array>} 테넌트별 코드 목록 (코어 코드 폴백 없음)
 */
export const getTenantCodes = async (codeGroup = null) => {
    try {
        const url = codeGroup ? `${API_BASE}/tenant?codeGroup=${codeGroup}` : `${API_BASE}/tenant`;
        const response = await apiGet(url);
        
        if (response.success && response.data) {
            return response.data.codes || [];
        }
        
        // 하위 호환성: 기존 API 형식 지원
        if (Array.isArray(response)) {
            return response;
        }
        
        return [];
    } catch (error) {
        console.error('테넌트 코드 조회 실패:', error);
        return [];
    }
};

/**
 * 코어 코드 전용 조회
 * @param {string} codeGroup - 코드 그룹
 * @returns {Promise<Array>} 코어 코드 목록
 */
export const getCoreCodes = async (codeGroup) => {
    try {
        const response = await apiGet(`${API_BASE}/core/groups/${codeGroup}`);
        
        if (Array.isArray(response)) {
            return response;
        }
        
        if (response.success && response.data) {
            return response.data.codes || response.data || [];
        }
        
        return [];
    } catch (error) {
        console.error('코어 코드 조회 실패:', error);
        return [];
    }
};

/**
 * 공통코드 상세 조회
 * @param {number} id - 공통코드 ID
 * @returns {Promise<Object|null>} 공통코드 상세 정보
 */
export const getCommonCodeById = async (id) => {
    try {
        const response = await apiGet(`${API_BASE}/${id}`);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        return null;
    } catch (error) {
        console.error('공통코드 상세 조회 실패:', error);
        return null;
    }
};

/**
 * 공통코드 생성
 * @param {Object} codeData - 공통코드 데이터
 * @returns {Promise<Object|null>} 생성된 공통코드
 */
export const createCommonCode = async (codeData) => {
    try {
        const response = await apiPost(API_BASE, codeData);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        throw new Error(response.message || '공통코드 생성에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 생성 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 수정
 * @param {number} id - 공통코드 ID
 * @param {Object} codeData - 수정할 공통코드 데이터
 * @returns {Promise<Object|null>} 수정된 공통코드
 */
export const updateCommonCode = async (id, codeData) => {
    try {
        const response = await apiPut(`${API_BASE}/${id}`, codeData);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        throw new Error(response.message || '공통코드 수정에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 수정 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 삭제
 * @param {number} id - 공통코드 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteCommonCode = async (id) => {
    try {
        const response = await apiDelete(`${API_BASE}/${id}`);
        
        if (response.success) {
            return true;
        }
        
        throw new Error(response.message || '공통코드 삭제에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 삭제 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 상태 토글
 * @param {number} id - 공통코드 ID
 * @returns {Promise<Object|null>} 수정된 공통코드
 */
export const toggleCommonCodeStatus = async (id) => {
    try {
        const response = await apiPut(`${API_BASE}/${id}/toggle-status`, {});
        
        if (response.success && response.data) {
            return response.data;
        }
        
        throw new Error(response.message || '공통코드 상태 변경에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 상태 변경 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 일괄 생성
 * @param {Array<Object>} codesData - 공통코드 데이터 배열
 * @returns {Promise<Array>} 생성된 공통코드 목록
 */
export const createCommonCodesBatch = async (codesData) => {
    try {
        const response = await apiPost(`${API_BASE}/batch`, codesData);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        throw new Error(response.message || '공통코드 일괄 생성에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 일괄 생성 실패:', error);
        throw error;
    }
};

/**
 * 코드 그룹 목록 조회 (하위 호환성)
 * @returns {Promise<Array>} 코드 그룹 목록
 */
export const getCodeGroups = async () => {
    try {
        // 새로운 API 시도
        const response = await apiGet(`${API_BASE}?codeGroup=`);
        
        if (response.success && response.data) {
            // 코드 그룹 목록 추출
            const codes = response.data.codes || [];
            const groups = [...new Set(codes.map(code => code.codeGroup))];
            return groups;
        }
        
        // 하위 호환성: 기존 API 사용
        const legacyResponse = await apiGet('/api/common-codes/groups/list');
        if (Array.isArray(legacyResponse)) {
            return legacyResponse;
        }
        
        return [];
    } catch (error) {
        console.error('코드 그룹 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 코어 코드 조회 (HQ 관리자 전용)
 * @param {string} codeGroup - 코드 그룹
 * @returns {Promise<Array>} 코어 코드 목록
 */
export const getCoreCodesAPI = async (codeGroup) => {
    try {
        const response = await apiGet(`${API_BASE}?codeGroup=${codeGroup}`);
        
        if (response?.data?.codes && Array.isArray(response.data.codes)) {
            return response.data.codes;
        }
        
        return [];
    } catch (error) {
        console.error('코어 코드 조회 실패:', error);
        return [];
    }
};

