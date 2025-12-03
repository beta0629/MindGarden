/**
 * 테넌트 공통코드 관리 API
 * 
 * 테넌트 관리자가 자신의 테넌트 전용 공통코드를 관리합니다.
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const TENANT_COMMON_CODE_API = `${API_BASE_URL}/api/v1/tenant/common-codes`;

/**
 * 테넌트 공통코드 그룹 목록 조회
 */
export const getTenantCodeGroups = async () => {
    try {
        const response = await axios.get(`${TENANT_COMMON_CODE_API}/groups`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 그룹 조회 실패:', error);
        throw error;
    }
};

/**
 * 특정 그룹의 테넌트 공통코드 목록 조회
 */
export const getTenantCodesByGroup = async (codeGroup) => {
    try {
        const response = await axios.get(`${TENANT_COMMON_CODE_API}/groups/${codeGroup}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error(`테넌트 공통코드 조회 실패 (${codeGroup}):`, error);
        throw error;
    }
};

/**
 * 테넌트 공통코드 생성
 */
export const createTenantCode = async (codeData) => {
    try {
        const response = await axios.post(TENANT_COMMON_CODE_API, codeData, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 생성 실패:', error);
        throw error;
    }
};

/**
 * 테넌트 공통코드 수정
 */
export const updateTenantCode = async (codeId, codeData) => {
    try {
        const response = await axios.put(`${TENANT_COMMON_CODE_API}/${codeId}`, codeData, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 수정 실패:', error);
        throw error;
    }
};

/**
 * 테넌트 공통코드 삭제
 */
export const deleteTenantCode = async (codeId) => {
    try {
        const response = await axios.delete(`${TENANT_COMMON_CODE_API}/${codeId}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 삭제 실패:', error);
        throw error;
    }
};

/**
 * 테넌트 공통코드 활성화/비활성화
 */
export const toggleTenantCodeActive = async (codeId, isActive) => {
    try {
        const response = await axios.patch(
            `${TENANT_COMMON_CODE_API}/${codeId}/active`,
            { isActive },
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 활성화 토글 실패:', error);
        throw error;
    }
};

/**
 * 테넌트 공통코드 정렬 순서 변경
 */
export const updateTenantCodeOrder = async (codeId, sortOrder) => {
    try {
        const response = await axios.patch(
            `${TENANT_COMMON_CODE_API}/${codeId}/order`,
            { sortOrder },
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('테넌트 공통코드 정렬 순서 변경 실패:', error);
        throw error;
    }
};

/**
 * 상담 패키지 생성 (금액 포함)
 */
export const createConsultationPackage = async (packageData) => {
    try {
        const response = await axios.post(
            `${TENANT_COMMON_CODE_API}/consultation-packages`,
            packageData,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('상담 패키지 생성 실패:', error);
        throw error;
    }
};

/**
 * 평가 유형 생성 (금액 포함)
 */
export const createAssessmentType = async (assessmentData) => {
    try {
        const response = await axios.post(
            `${TENANT_COMMON_CODE_API}/assessment-types`,
            assessmentData,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('평가 유형 생성 실패:', error);
        throw error;
    }
};

