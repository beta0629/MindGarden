// import React from 'react';
import MGButton from '../../../components/common/MGButton'; // 임시 비활성화
import Avatar from '../../common/Avatar';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { USER_ROLES, LEGACY_USER_ROLES } from '../../../constants/roles';
import { useTranslation } from 'react-i18next';

/**
 * AdminDashboard 헤더 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const AdminDashboardHeader = ({
    currentUser,
    userPermissions,
    onNavigate
}) => {
    const { t } = useTranslation();
    const hasNotificationPermission = userPermissions.includes('NOTIFICATION_MANAGEMENT');
    const hasSystemConfigPermission = userPermissions.includes('SYSTEM_CONFIG');
    const hasUserManagementPermission = userPermissions.includes('USER_MANAGEMENT');

    return (
        <div className="mg-v2-admin-dashboard-header">
            <div className="mg-v2-admin-dashboard-header-left">
                <div className="mg-v2-admin-dashboard-user-info">
                    <Avatar
                        profileImageUrl={currentUser?.avatar || currentUser?.profileImageUrl}
                        displayName={currentUser?.name}
                        className="mg-v2-admin-dashboard-avatar"
                    />
                    <div className="mg-v2-admin-dashboard-user-details">
                        <h2 className="mg-v2-admin-dashboard-welcome">
                            안녕하세요, {currentUser?.name || '관리자'}님
                        </h2>
                        <p className="mg-v2-admin-dashboard-role">
                            {currentUser?.role === USER_ROLES.ADMIN ? '시스템 관리자' :
                             currentUser?.role === LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN ? '지점 관리자' : '관리자'}
                        </p>
                        {currentUser?.branchName && (
                            <p className="mg-v2-admin-dashboard-branch">
                                지점: {currentUser.branchName}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mg-v2-admin-dashboard-header-right">
                <div className="mg-v2-admin-dashboard-actions">
                    {hasNotificationPermission && (
                        <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-admin-dashboard-action-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => onNavigate('/admin/notifications')}
                        >
                            알림 관리
                        </MGButton>
                    )}
                    
                    {hasSystemConfigPermission && (
                        <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-admin-dashboard-action-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => onNavigate('/admin/system-config')}
                        >
                            {t('admin.labels.systemSettings')}
                        </MGButton>
                    )}
                    
                    {hasUserManagementPermission && (
                        <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-admin-dashboard-action-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => onNavigate('/admin/user-management')}
                        >
                            {t('admin.labels.userManagement')}
                        </MGButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHeader;
