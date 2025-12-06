/**
 * 권한 그룹 관리 컨테이너 (Container Component)
 * 
 * 비즈니스 로직 담당:
/**
 * - API 호출
/**
 * - 상태 관리
/**
 * - 이벤트 핸들러
/**
 * 
/**
 * UI 렌더링은 PermissionGroupManagementUI에 위임
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import {
    getAllPermissionGroups,
    grantPermissionGroup,
    revokePermissionGroup,
    batchGrantPermissionGroups
} from '../../utils/permissionGroupApi';
import PermissionGroupManagementUI from '../ui/PermissionGroupManagementUI';

const PermissionGroupManagement = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [rolePermissions, setRolePermissions] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

/**
     * 초기 로드: 역할 목록 및 권한 그룹 조회
     */
    useEffect(() => {
        fetchRoles();
        fetchPermissionGroups();
    }, []);

/**
     * 선택된 역할 변경 시 권한 조회
     */
    useEffect(() => {
        if (selectedRole) {
            fetchRolePermissions(selectedRole.tenantRoleId);
        }
    }, [selectedRole]);

/**
     * 역할 목록 조회
     */
    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // TODO: 실제 API로 변경 (현재는 임시 데이터)
            // const response = await axios.get('/api/v1/tenant/roles');
            
            // 임시 데이터
            const mockRoles = [
                { tenantRoleId: '1', nameKo: '관리자', nameEn: 'ADMIN' },
                { tenantRoleId: '2', nameKo: '사무원', nameEn: 'STAFF' },
                { tenantRoleId: '3', nameKo: '상담사', nameEn: 'CONSULTANT' },
                { tenantRoleId: '4', nameKo: '내담자', nameEn: 'CLIENT' }
            ];
            
            setRoles(mockRoles);
        } catch (err) {
            console.error('역할 조회 오류:', err);
            setError('역할 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 권한 그룹 목록 조회
     */
    const fetchPermissionGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getAllPermissionGroups();
            
            if (response.success) {
                setPermissionGroups(response.data || []);
            } else {
                setError(response.message || '권한 그룹 조회 실패');
            }
        } catch (err) {
            console.error('권한 그룹 조회 오류:', err);
            setError('권한 그룹을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 역할의 권한 조회
     */
    const fetchRolePermissions = async (roleId) => {
        try {
            setLoading(true);
            setError(null);
            
            // TODO: 실제 API로 변경
            // 현재는 빈 Map으로 시작 (백엔드 API 구현 필요)
            setRolePermissions(new Map());
        } catch (err) {
            console.error('권한 조회 오류:', err);
            setError('권한을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 역할 선택
     */
    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setRolePermissions(new Map());
        setError(null);
    };

/**
     * 권한 그룹 부여
     */
    const handleGrantPermission = async (groupCode, accessLevel) => {
        if (!selectedRole) {
            setError('역할을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await grantPermissionGroup({
                roleId: selectedRole.tenantRoleId,
                groupCode,
                accessLevel
            });

            if (response.success) {
                // 권한 목록 새로고침
                await fetchRolePermissions(selectedRole.tenantRoleId);
            } else {
                setError(response.message || '권한 부여 실패');
            }
        } catch (err) {
            console.error('권한 부여 오류:', err);
            setError('권한 부여 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 권한 그룹 회수
     */
    const handleRevokePermission = async (groupCode) => {
        if (!selectedRole) {
            setError('역할을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await revokePermissionGroup(
                selectedRole.tenantRoleId,
                groupCode
            );

            if (response.success) {
                // 권한 목록 새로고침
                await fetchRolePermissions(selectedRole.tenantRoleId);
            } else {
                setError(response.message || '권한 회수 실패');
            }
        } catch (err) {
            console.error('권한 회수 오류:', err);
            setError('권한 회수 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 권한 그룹 일괄 부여
     */
    const handleBatchGrant = async (groupCodes, accessLevel) => {
        if (!selectedRole) {
            setError('역할을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await batchGrantPermissionGroups(
                selectedRole.tenantRoleId,
                { groupCodes, accessLevel }
            );

            if (response.success) {
                // 권한 목록 새로고침
                await fetchRolePermissions(selectedRole.tenantRoleId);
            } else {
                setError(response.message || '권한 일괄 부여 실패');
            }
        } catch (err) {
            console.error('권한 일괄 부여 오류:', err);
            setError('권한 일괄 부여 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SimpleLayout title="권한 그룹 관리" loading={loading && !selectedRole} loadingText="데이터를 불러오는 중...">
            <PermissionGroupManagementUI
                roles={roles}
                selectedRole={selectedRole}
                permissionGroups={permissionGroups}
                rolePermissions={rolePermissions}
                loading={loading}
                error={error}
                onRoleSelect={handleRoleSelect}
                onGrantPermission={handleGrantPermission}
                onRevokePermission={handleRevokePermission}
                onBatchGrant={handleBatchGrant}
            />
        </SimpleLayout>
    );
};

export default PermissionGroupManagement;

