/**
 * 권한 그룹 Hook
 * 
/**
 * 사용자의 권한 그룹을 관리하는 커스텀 Hook
/**
 * 
/**
 * 표준화 준수:
/**
 * - 재사용 가능한 Hook
/**
 * - 명확한 반환값
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import { useState, useEffect, useCallback } from 'react';
import { getMyPermissionGroups } from '../utils/permissionGroupApi';
import { useSession } from '../contexts/SessionContext';

/**
 * 권한 그룹 Hook
/**
 * 
/**
 * @returns {Object} { permissionGroups, hasPermissionGroup, loading, error }
 */
export const usePermissionGroups = () => {
    const { isLoggedIn, isLoading: sessionLoading } = useSession();
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

/**
     * 권한 그룹 조회
     */
    const fetchPermissionGroups = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getMyPermissionGroups();
            
            if (response && response.success) {
                setPermissionGroups(response.data || []);
            } else {
                // 실패한 경우 조용히 처리 (권한 그룹은 선택적 기능)
                setPermissionGroups([]);
            }
        } catch (err) {
            // 모든 에러는 조용히 처리 (권한 그룹이 필수가 아닌 경우)
            setPermissionGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 세션이 로딩 중이거나 로그인되지 않은 경우 API 호출하지 않음
        if (sessionLoading) {
            return;
        }
        
        if (!isLoggedIn) {
            setLoading(false);
            setPermissionGroups([]);
            return;
        }
        
        fetchPermissionGroups();
    }, [isLoggedIn, sessionLoading, fetchPermissionGroups]);

/**
     * 특정 권한 그룹 보유 여부 확인
/**
     * 
/**
     * @param {string} groupCode 권한 그룹 코드
/**
     * @returns {boolean} 권한 보유 여부
     */
    const hasPermissionGroup = (groupCode) => {
        if (!groupCode) return false;
        return permissionGroups.includes(groupCode);
    };

/**
     * 여러 권한 그룹 중 하나라도 보유 여부 확인
/**
     * 
/**
     * @param {string[]} groupCodes 권한 그룹 코드 배열
/**
     * @returns {boolean} 권한 보유 여부
     */
    const hasAnyPermissionGroup = (groupCodes) => {
        if (!groupCodes || groupCodes.length === 0) return false;
        return groupCodes.some(code => hasPermissionGroup(code));
    };

/**
     * 모든 권한 그룹 보유 여부 확인
/**
     * 
/**
     * @param {string[]} groupCodes 권한 그룹 코드 배열
/**
     * @returns {boolean} 권한 보유 여부
     */
    const hasAllPermissionGroups = (groupCodes) => {
        if (!groupCodes || groupCodes.length === 0) return false;
        return groupCodes.every(code => hasPermissionGroup(code));
    };

    return {
        permissionGroups,
        hasPermissionGroup,
        hasAnyPermissionGroup,
        hasAllPermissionGroups,
        loading,
        error,
        refetch: fetchPermissionGroups
    };
};

