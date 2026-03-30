/**
 * 테넌트 공통코드 관리 API
/**
 * 
/**
 * 테넌트 관리자가 자신의 테넌트 전용 공통코드를 관리합니다.
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import axios from 'axios';
import { getApiBaseUrl } from '../constants/api';
import { getDefaultApiHeaders } from './apiHeaders';

/**
 * 테넌트 공통코드 API 기본 URL (런타임에 동적 생성)
 */
const getTenantCommonCodeApiBase = () => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/v1/tenant/common-codes`;
};

/**
 * 테넌트 공통코드 그룹 목록 조회
 */
export const getTenantCodeGroups = async () => {
    try {
        const apiBase = getTenantCommonCodeApiBase();
        const url = `${apiBase}/groups`;
        console.log('📋 테넌트 공통코드 그룹 조회 API 호출:', url);
        
        const headers = getDefaultApiHeaders();
        console.log('📋 API 헤더:', { ...headers, 'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined, 'X-Tenant-Id': headers['X-Tenant-Id'] });
        
        const response = await axios.get(url, {
            withCredentials: true,
            headers
        });
        
        console.log('✅ 테넌트 공통코드 그룹 조회 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ 테넌트 공통코드 그룹 조회 실패:', error);
        console.error('❌ 오류 상세:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        throw error;
    }
};

/**
 * 특정 그룹의 테넌트 공통코드 목록 조회
 */
export const getTenantCodesByGroup = async (codeGroup) => {
    try {
        const apiBase = getTenantCommonCodeApiBase();
        const url = `${apiBase}/groups/${codeGroup}`;
        console.log('📋 테넌트 공통코드 조회 API 호출:', url, 'codeGroup:', codeGroup);
        
        const headers = getDefaultApiHeaders();
        console.log('📋 API 헤더:', { ...headers, 'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined, 'X-Tenant-Id': headers['X-Tenant-Id'] });
        
        const response = await axios.get(url, {
            withCredentials: true,
            headers
        });
        
        console.log('✅ 테넌트 공통코드 조회 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ 테넌트 공통코드 조회 실패 (${codeGroup}):`, error);
        console.error('❌ 오류 상세:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        throw error;
    }
};

/**
 * 테넌트 공통코드 생성
 */
export const createTenantCode = async (codeData) => {
    try {
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.post(apiBase, codeData, {
            withCredentials: true,
            headers
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.put(`${apiBase}/${codeId}`, codeData, {
            withCredentials: true,
            headers
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.delete(`${apiBase}/${codeId}`, {
            withCredentials: true,
            headers
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.patch(
            `${apiBase}/${codeId}/active`,
            { isActive },
            { 
                withCredentials: true,
                headers
            }
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.patch(
            `${apiBase}/${codeId}/order`,
            { sortOrder },
            { 
                withCredentials: true,
                headers
            }
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.post(
            `${apiBase}/consultation-packages`,
            packageData,
            { 
                withCredentials: true,
                headers
            }
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
        const apiBase = getTenantCommonCodeApiBase();
        const headers = getDefaultApiHeaders();
        const response = await axios.post(
            `${apiBase}/assessment-types`,
            assessmentData,
            { 
                withCredentials: true,
                headers
            }
        );
        return response.data;
    } catch (error) {
        console.error('평가 유형 생성 실패:', error);
        throw error;
    }
};

