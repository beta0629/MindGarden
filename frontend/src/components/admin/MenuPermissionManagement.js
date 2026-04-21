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
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import {
    getRoleMenuPermissions,
    grantMenuPermission,
    batchUpdateMenuPermissions
} from '../../utils/menuPermissionApi';
import MenuPermissionManagementUI from '../ui/MenuPermissionManagementUI';
import {
    MENU_PERM_BUTTON,
    MENU_PERM_CONFIRM,
    MENU_PERM_MOCK_ROLES,
    MENU_PERM_MSG,
    MENU_PERM_PAGE,
    MENU_PERM_TOAST
} from '../../constants/menuPermissionManagementStrings';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

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
    const fetchRoles = async() => {
        try {
            setLoading(true);
            setError(null);
            
            // TODO: 실제 API로 변경 (현재는 임시 데이터)
            // const response = await axios.get('/api/v1/tenant/roles');
            
            // 임시 데이터
            setRoles([...MENU_PERM_MOCK_ROLES]);
        } catch (err) {
            console.error('역할 조회 오류:', err);
            setError(MENU_PERM_MSG.ERR_LOAD_ROLES);
        } finally {
            setLoading(false);
        }
    };

/**
     * 메뉴 권한 조회
     */
    const fetchMenuPermissions = async(roleId) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getRoleMenuPermissions(roleId);
            
            if (response.success) {
                setMenuPermissions(response.data || []);
            } else {
                setError(response.message || MENU_PERM_MSG.QUERY_FAIL);
            }
        } catch (err) {
            console.error('메뉴 권한 조회 오류:', err);
            setError(MENU_PERM_MSG.ERR_LOAD_MENU_PERM);
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
    const handlePermissionChange = async(menuId, field, value) => {
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
                setError(response.message || MENU_PERM_MSG.PERM_CHANGE_FAIL);
                // 롤백
                fetchMenuPermissions(selectedRole.tenantRoleId);
            }
        } catch (err) {
            console.error('권한 변경 오류:', err);
            setError(MENU_PERM_MSG.ERR_PERM_CHANGE);
            // 롤백
            fetchMenuPermissions(selectedRole.tenantRoleId);
        }
    };

/**
     * 일괄 저장
     */
    const handleBatchSave = async() => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm(MENU_PERM_CONFIRM.BATCH_SAVE, resolve);
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
                notificationManager.success(MENU_PERM_TOAST.SAVED);
                fetchMenuPermissions(selectedRole.tenantRoleId);
            } else {
                setError(response.message || MENU_PERM_MSG.SAVE_FAIL);
            }
        } catch (err) {
            console.error('일괄 저장 오류:', err);
            setError(MENU_PERM_MSG.ERR_SAVE);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminCommonLayout title={MENU_PERM_PAGE.TITLE}>
            <div className="mg-v2-ad-b0kla mg-v2-menu-permission-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel={MENU_PERM_PAGE.ARIA_MAIN}>
                        <ContentHeader
                            title={MENU_PERM_PAGE.TITLE}
                            subtitle={MENU_PERM_PAGE.SUBTITLE}
                            titleId="menu-permission-management-title"
                            actions={
                                selectedRole ? (
                                    <MGButton
                                        variant="primary"
                                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                                        onClick={handleBatchSave}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        preventDoubleClick={true}
                                    >
                                        {MENU_PERM_BUTTON.SAVE_CHANGES}
                                    </MGButton>
                                ) : null
                            }
                        />
                        <main aria-labelledby="menu-permission-management-title">
                            {loading && !selectedRole ? (
                                <div className="mg-dashboard-loading" aria-busy="true" aria-live="polite">
                                    <UnifiedLoading type="inline" text={MENU_PERM_PAGE.LOADING} />
                                </div>
                            ) : (
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
                            )}
                        </main>
                    </ContentArea>
                </div>
            </div>
        </AdminCommonLayout>
    );
};

export default MenuPermissionManagement;

