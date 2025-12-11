/**
 * 권한 그룹 API 유틸리티
/**
 * 
/**
 * 표준화 준수:
/**
 * - API 버전 관리 (/api/v1/*)
/**
 * - 표준 에러 처리
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import axios from 'axios';

import { getApiBaseUrl } from '../constants/api';

// 런타임에 API_BASE_URL 가져오기 (window.location 확인)
const getPermissionGroupApi = () => `${getApiBaseUrl()}/api/v1/permissions/groups`;
const getPermissionGroupApi() = getPermissionGroupApi(); // 하위 호환성을 위해 유지

/**
 * 내 권한 그룹 조회
 */
export const getMyPermissionGroups = async () => {
    try {
        const response = await axios.get(`${getPermissionGroupApi()}/my`, {
            withCredentials: true,
            // 400 에러를 예외로 처리하지 않도록 설정
            validateStatus: (status) => status < 500 // 500 이상만 에러로 처리
        });
        
        // 400 에러는 세션 정보 부족일 가능성이 높으므로 조용히 처리
        if (response.status === 400) {
            return {
                success: false,
                message: '세션 정보가 부족합니다.',
                data: []
            };
        }
        
        return response.data;
    } catch (error) {
        // 네트워크 에러나 500 이상의 서버 에러만 처리
        // 400 에러는 validateStatus로 이미 처리됨
        if (error.response && error.response.status >= 500) {
            console.error('내 권한 그룹 조회 서버 에러:', error.response.status);
        }
        return {
            success: false,
            message: error.response?.data?.message || '권한 그룹 조회 실패',
            data: []
        };
    }
};

/**
 * 권한 그룹 체크
 */
export const checkPermissionGroup = async (groupCode) => {
    try {
        const response = await axios.get(`${getPermissionGroupApi()}/check/${groupCode}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('권한 그룹 체크 실패:', error);
        throw error;
    }
};

/**
 * 권한 그룹 레벨 조회
 */
export const getPermissionGroupLevel = async (groupCode) => {
    try {
        const response = await axios.get(`${getPermissionGroupApi()}/level/${groupCode}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('권한 그룹 레벨 조회 실패:', error);
        throw error;
    }
};

/**
 * 모든 권한 그룹 조회
 */
export const getAllPermissionGroups = async () => {
    try {
        const response = await axios.get(`${getPermissionGroupApi()}/all`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('모든 권한 그룹 조회 실패:', error);
        throw error;
    }
};

/**
 * 권한 그룹 부여
 */
export const grantPermissionGroup = async (request) => {
    try {
        const response = await axios.post(`${getPermissionGroupApi()}/grant`, request, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('권한 그룹 부여 실패:', error);
        throw error;
    }
};

/**
 * 권한 그룹 회수
 */
export const revokePermissionGroup = async (roleId, groupCode) => {
    try {
        const response = await axios.delete(`${getPermissionGroupApi()}/revoke`, {
            params: { roleId, groupCode },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('권한 그룹 회수 실패:', error);
        throw error;
    }
};

/**
 * 권한 그룹 일괄 부여
 */
export const batchGrantPermissionGroups = async (roleId, request) => {
    try {
        const response = await axios.post(
            `${getPermissionGroupApi()}/batch?roleId=${roleId}`,
            request,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('권한 그룹 일괄 부여 실패:', error);
        throw error;
    }
};

