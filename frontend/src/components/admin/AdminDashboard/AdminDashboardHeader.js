import React from 'react';
import MGButton from '../../common/MGButton';
import { FaBell, FaCog, FaUserCog } from 'react-icons/fa';
import { Bell, Settings, User } from 'lucide-react';

/**
 * AdminDashboard 헤더 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const AdminDashboardHeader = ({
    currentUser,
    userPermissions,
    onNavigate,
    getAvatarInitial
}) => {
    const hasNotificationPermission = userPermissions.includes('NOTIFICATION_MANAGEMENT');
    const hasSystemConfigPermission = userPermissions.includes('SYSTEM_CONFIG');
    const hasUserManagementPermission = userPermissions.includes('USER_MANAGEMENT');

    return (
        <div className="mg-v2-admin-dashboard-header">
            <div className="mg-v2-admin-dashboard-header-left">
                <div className="mg-v2-admin-dashboard-user-info">
                    <div className="mg-v2-admin-dashboard-avatar">
                        {getAvatarInitial(currentUser?.name)}
                    </div>
                    <div className="mg-v2-admin-dashboard-user-details">
                        <h2 className="mg-v2-admin-dashboard-welcome">
                            안녕하세요, {currentUser?.name || '관리자'}님
                        </h2>
                        <p className="mg-v2-admin-dashboard-role">
                            {currentUser?.role === 'ADMIN' ? '시스템 관리자' : 
                             currentUser?.role === 'BRANCH_SUPER_ADMIN' ? '지점 관리자' : 
                             currentUser?.role === 'HQ_MASTER' ? '본사 관리자' : 
                             currentUser?.role === 'SUPER_HQ_ADMIN' ? '최고 관리자' : '관리자'}
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
                            onClick={() => onNavigate('/admin/system-notifications')}
                            className="mg-v2-admin-dashboard-action-btn"
                        >
                            <Bell className="mg-v2-icon" />
                            알림 관리
                        </MGButton>
                    )}
                    
                    {hasSystemConfigPermission && (
                        <MGButton
                            variant="outline"
                            size="small"
                            onClick={() => onNavigate('/admin/system-config')}
                            className="mg-v2-admin-dashboard-action-btn"
                        >
                            <Settings className="mg-v2-icon" />
                            시스템 설정
                        </MGButton>
                    )}
                    
                    {hasUserManagementPermission && (
                        <MGButton
                            variant="outline"
                            size="small"
                            onClick={() => onNavigate('/admin/user-management')}
                            className="mg-v2-admin-dashboard-action-btn"
                        >
                            <User className="mg-v2-icon" />
                            사용자 관리
                        </MGButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHeader;
