/**
 * 메뉴 권한 관리 컨테이너 (Container Component)
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
 * UI 렌더링은 MenuPermissionManagementUI에 위임
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React, { useState, useEffect } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import {
    getRoleMenuPermissions,
    grantMenuPermission,
    batchUpdateMenuPermissions
} from '../../utils/menuPermissionApi';
import MenuPermissionManagementUI from '../ui/MenuPermissionManagementUI';

const MenuPermissionManagement = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [menuPermissions, setMenuPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

/**
     * 초기 로드: 역할 목록 조회
     */
    useEffect(() => {
        fetchRoles();
    }, []);

/**
     * 선택된 역할 변경 시 메뉴 권한 조회
     */
    useEffect(() => {
        if (selectedRole) {
            fetchMenuPermissions(selectedRole.tenantRoleId);
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
     * 메뉴 권한 조회
     */
    const fetchMenuPermissions = async (roleId) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getRoleMenuPermissions(roleId);
            
            if (response.success) {
                setMenuPermissions(response.data || []);
            } else {
                setError(response.message || '메뉴 권한 조회 실패');
            }
        } catch (err) {
            console.error('메뉴 권한 조회 오류:', err);
            setError('메뉴 권한을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 역할 선택
     */
    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setMenuPermissions([]);
        setError(null);
    };

/**
     * 권한 변경
     */
    const handlePermissionChange = async (menuId, field, value) => {
        try {
            setError(null);
            
            // 로컬 상태 업데이트
            setMenuPermissions(prev => prev.map(menu => {
                if (menu.menuId === menuId) {
                    return {
                        ...menu,
                        [field]: value,
                        hasPermission: field === 'canView' ? value : menu.hasPermission
                    };
                }
                return menu;
            }));

            // API 호출
            const menu = menuPermissions.find(m => m.menuId === menuId);
            const response = await grantMenuPermission({
                roleId: selectedRole.tenantRoleId,
                menuId: menuId,
                canView: field === 'canView' ? value : menu.canView,
                canCreate: field === 'canCreate' ? value : menu.canCreate,
                canUpdate: field === 'canUpdate' ? value : menu.canUpdate,
                canDelete: field === 'canDelete' ? value : menu.canDelete
            });

            if (!response.success) {
                setError(response.message || '권한 변경 실패');
                // 롤백
                fetchMenuPermissions(selectedRole.tenantRoleId);
            }
        } catch (err) {
            console.error('권한 변경 오류:', err);
            setError('권한 변경 중 오류가 발생했습니다.');
            // 롤백
            fetchMenuPermissions(selectedRole.tenantRoleId);
        }
    };

/**
     * 일괄 저장
     */
    const handleBatchSave = async () => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm('변경사항을 저장하시겠습니까?', resolve);
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const requests = menuPermissions
                .filter(m => m.hasPermission || m.canView)
                .map(m => ({
                    roleId: selectedRole.tenantRoleId,
                    menuId: m.menuId,
                    canView: m.canView || false,
                    canCreate: m.canCreate || false,
                    canUpdate: m.canUpdate || false,
                    canDelete: m.canDelete || false
                }));

            const response = await batchUpdateMenuPermissions(selectedRole.tenantRoleId, requests);

            if (response.success) {
                notificationManager.success('저장되었습니다.');
                fetchMenuPermissions(selectedRole.tenantRoleId);
            } else {
                setError(response.message || '저장 실패');
            }
        } catch (err) {
            console.error('일괄 저장 오류:', err);
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminCommonLayout title="메뉴 권한 관리" loading={loading && !selectedRole} loadingText="데이터를 불러오는 중...">
            <MenuPermissionManagementUI
                roles={roles}
                selectedRole={selectedRole}
                menuPermissions={menuPermissions}
                loading={loading}
                error={error}
                onRoleSelect={handleRoleSelect}
                onPermissionChange={handlePermissionChange}
                onBatchSave={handleBatchSave}
            />
        </AdminCommonLayout>
    );
};

export default MenuPermissionManagement;

