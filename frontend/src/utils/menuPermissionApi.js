/**
 * 메뉴 권한 API 유틸리티
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
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import axios from 'axios';
import { getApiBaseUrl } from '../constants/api';

const getMenuPermissionApi = () => `${getApiBaseUrl()}/api/v1/admin/menu-permissions`;

/**
 * 역할별 메뉴 권한 목록 조회
 */
export const getRoleMenuPermissions = async (roleId) => {
    try {
        const response = await axios.get(`${getMenuPermissionApi()}/roles/${roleId}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('역할별 메뉴 권한 조회 실패:', error);
        throw error;
    }
};

/**
 * 메뉴 권한 부여
 */
export const grantMenuPermission = async (request) => {
    try {
        const response = await axios.post(`${getMenuPermissionApi()}/grant`, request, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('메뉴 권한 부여 실패:', error);
        throw error;
    }
};

/**
 * 메뉴 권한 회수
 */
export const revokeMenuPermission = async (roleId, menuId) => {
    try {
        const response = await axios.delete(`${getMenuPermissionApi()}/revoke`, {
            params: { roleId, menuId },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('메뉴 권한 회수 실패:', error);
        throw error;
    }
};

/**
 * 메뉴 권한 일괄 설정
 */
export const batchUpdateMenuPermissions = async (roleId, requests) => {
    try {
        const response = await axios.post(
            `${getMenuPermissionApi()}/batch?roleId=${roleId}`,
            requests,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('메뉴 권한 일괄 업데이트 실패:', error);
        throw error;
    }
};

/**
 * 사용자 접근 가능한 메뉴 조회
 */
export const getUserAccessibleMenus = async () => {
    try {
        const response = await axios.get(`${getMenuPermissionApi()}/user/accessible`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('사용자 접근 가능한 메뉴 조회 실패:', error);
        throw error;
    }
};

