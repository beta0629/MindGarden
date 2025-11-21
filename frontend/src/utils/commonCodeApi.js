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
 * 공통코드 목록 조회
 * @param {string} codeGroup - 코드 그룹 (선택)
 * @returns {Promise<Array>} 공통코드 목록
 */
export const getCommonCodes = async (codeGroup = null) => {
    try {
        const url = codeGroup ? `${API_BASE}?codeGroup=${codeGroup}` : API_BASE;
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
export const getCoreCodes = async (codeGroup) => {
    try {
        const response = await apiGet(`${API_BASE}/core/groups/${codeGroup}`);
        
        if (Array.isArray(response)) {
            return response;
        }
        
        return [];
    } catch (error) {
        console.error('코어 코드 조회 실패:', error);
        return [];
    }
};

/**
 * 테넌트 코드 조회
 * @param {string} codeGroup - 코드 그룹
 * @returns {Promise<Array>} 테넌트 코드 목록
 */
export const getTenantCodes = async (codeGroup) => {
    try {
        const response = await apiGet(`${API_BASE}/tenant/groups/${codeGroup}`);
        
        if (Array.isArray(response)) {
            return response;
        }
        
        return [];
    } catch (error) {
        console.error('테넌트 코드 조회 실패:', error);
        return [];
    }
};

