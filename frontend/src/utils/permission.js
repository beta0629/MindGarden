/**
 * 동적 권한 체크 유틸리티
 * 백엔드의 DynamicPermissionService와 연동하여 권한을 체크합니다.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../constants/api';

/**
 * 권한 체크 결과 캐시
 */
const permissionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 특정 권한을 가졌는지 확인
 * @param {string} permission - 권한 코드 (예: 'ACCESS_ERD', 'ACCESS_PAYMENT')
 * @param {Object} session - 세션 정보 (fetch 함수 포함)
 * @returns {Promise<boolean>} 권한 보유 여부
 */
export const hasPermission = async (permission, session) => {
    if (!permission || !session) {
        return false;
    }

    // 캐시 확인
    const cacheKey = `${session.user?.id}_${permission}`;
    const cached = permissionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.hasPermission;
    }

    try {
        const response = await session.fetch(API_ENDPOINTS.PERMISSIONS.CHECK_PERMISSION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permission })
        });

        if (!response.ok) {
            console.warn(`권한 체크 실패: ${permission}`, response.status);
            return false;
        }

        const result = await response.json();
        const hasPermissionResult = result.success && result.data?.hasPermission === true;

        // 캐시 저장
        permissionCache.set(cacheKey, {
            hasPermission: hasPermissionResult,
            timestamp: Date.now()
        });

        return hasPermissionResult;
    } catch (error) {
        console.error(`권한 체크 오류: ${permission}`, error);
        return false;
    }
};

/**
 * 여러 권한 중 하나라도 가지고 있는지 확인
 * @param {string[]} permissions - 권한 코드 배열
 * @param {Object} session - 세션 정보
 * @returns {Promise<boolean>} 권한 보유 여부
 */
export const hasAnyPermission = async (permissions, session) => {
    if (!permissions || permissions.length === 0 || !session) {
        return false;
    }

    for (const permission of permissions) {
        if (await hasPermission(permission, session)) {
            return true;
        }
    }
    return false;
};

/**
 * 모든 권한을 가지고 있는지 확인
 * @param {string[]} permissions - 권한 코드 배열
 * @param {Object} session - 세션 정보
 * @returns {Promise<boolean>} 권한 보유 여부
 */
export const hasAllPermissions = async (permissions, session) => {
    if (!permissions || permissions.length === 0 || !session) {
        return false;
    }

    for (const permission of permissions) {
        if (!(await hasPermission(permission, session))) {
            return false;
        }
    }
    return true;
};

/**
 * 권한 캐시 클리어
 */
export const clearPermissionCache = () => {
    permissionCache.clear();
};

/**
 * 사용자의 모든 권한 목록 조회
 * @param {Object} session - 세션 정보
 * @returns {Promise<string[]>} 권한 목록
 */
export const getUserPermissions = async (session) => {
    if (!session) {
        return [];
    }

    try {
        const response = await session.fetch(API_ENDPOINTS.PERMISSIONS.MY_PERMISSIONS, {
            method: 'GET'
        });

        if (!response.ok) {
            console.warn('사용자 권한 조회 실패', response.status);
            return [];
        }

        const result = await response.json();
        return result.success ? result.data?.permissions || [] : [];
    } catch (error) {
        console.error('사용자 권한 조회 오류', error);
        return [];
    }
};

/**
 * 권한 체크를 위한 React Hook
 * @param {string} permission - 권한 코드
 * @param {Object} session - 세션 정보
 * @returns {Object} { hasPermission, loading, error }
 */
export const usePermission = (permission, session) => {
    const [hasPermissionState, setHasPermissionState] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!permission || !session) {
            setLoading(false);
            return;
        }

        const checkPermission = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await hasPermission(permission, session);
                setHasPermissionState(result);
            } catch (err) {
                setError(err);
                setHasPermissionState(false);
            } finally {
                setLoading(false);
            }
        };

        checkPermission();
    }, [permission, session?.user?.id]);

    return { hasPermission: hasPermissionState, loading, error };
};

// 권한 코드 상수
export const PERMISSIONS = {
    // ERD 관련
    ACCESS_ERD: 'ACCESS_ERD',
    
    // 결제 관련
    ACCESS_PAYMENT: 'ACCESS_PAYMENT',
    REQUEST_PAYMENT_APPROVAL: 'REQUEST_PAYMENT_APPROVAL',
    APPROVE_PAYMENT: 'APPROVE_PAYMENT',
    
    // 비품구매 관련
    REQUEST_SUPPLY_PURCHASE: 'REQUEST_SUPPLY_PURCHASE',
    
    // 스케줄러 관련
    REGISTER_SCHEDULER: 'REGISTER_SCHEDULER',
    VIEW_SCHEDULER_CONSULTANTS: 'VIEW_SCHEDULER_CONSULTANTS',
    
    // 지점 관리 관련
    VIEW_BRANCH_DETAILS: 'VIEW_BRANCH_DETAILS',
    MANAGE_BRANCH: 'MANAGE_BRANCH',
    
    // 시스템 관리 관련
    MANAGE_SYSTEM: 'MANAGE_SYSTEM'
};

// 권한 그룹
export const PERMISSION_GROUPS = {
    ADMIN: [
        PERMISSIONS.ACCESS_PAYMENT,
        PERMISSIONS.REQUEST_PAYMENT_APPROVAL,
        PERMISSIONS.REGISTER_SCHEDULER,
        PERMISSIONS.VIEW_SCHEDULER_CONSULTANTS
    ],
    BRANCH_BRANCH_SUPER_ADMIN: [
        PERMISSIONS.ACCESS_ERD,
        PERMISSIONS.ACCESS_PAYMENT,
        PERMISSIONS.APPROVE_PAYMENT,
        PERMISSIONS.REGISTER_SCHEDULER,
        PERMISSIONS.VIEW_SCHEDULER_CONSULTANTS
    ],
    CONSULTANT: [
        PERMISSIONS.REQUEST_SUPPLY_PURCHASE
    ],
    HQ_MASTER: [
        PERMISSIONS.VIEW_BRANCH_DETAILS,
        PERMISSIONS.MANAGE_BRANCH,
        PERMISSIONS.MANAGE_SYSTEM
    ]
};
