import React from 'react';
import SystemStatus from '../system/SystemStatus';
import SystemTools from '../system/SystemTools';
import PermissionManagement from '../PermissionManagement';
import ConsultantRatingStatistics from '../ConsultantRatingStatistics';
import SystemNotificationSection from '../../dashboard/SystemNotificationSection';

/**
 * AdminDashboard 시스템 섹션 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const AdminDashboardSystem = ({
    userPermissions,
    systemStatus,
    loading,
    onNavigate
}) => {
    const hasSystemPermission = userPermissions.includes('SYSTEM_CONFIG');
    const hasPermissionManagement = userPermissions.includes('PERMISSION_MANAGEMENT');
    const hasNotificationPermission = userPermissions.includes('NOTIFICATION_MANAGEMENT');
    const hasStatisticsPermission = userPermissions.includes('STATISTICS_VIEW');

    return (
        <div className="mg-v2-admin-dashboard-system">
            <div className="mg-v2-admin-dashboard-system-grid">
                {/* 시스템 상태 */}
                {hasSystemPermission && (
                    <div className="mg-v2-admin-dashboard-system-section">
                        <SystemStatus
                            status={systemStatus}
                            loading={loading}
                            onNavigate={onNavigate}
                        />
                    </div>
                )}

                {/* 시스템 도구 */}
                {hasSystemPermission && (
                    <div className="mg-v2-admin-dashboard-system-section">
                        <SystemTools
                            onNavigate={onNavigate}
                            loading={loading}
                        />
                    </div>
                )}

                {/* 권한 관리 */}
                {hasPermissionManagement && (
                    <div className="mg-v2-admin-dashboard-system-section">
                        <PermissionManagement
                            onNavigate={onNavigate}
                            loading={loading}
                        />
                    </div>
                )}

                {/* 상담사 평점 통계 */}
                {hasStatisticsPermission && (
                    <div className="mg-v2-admin-dashboard-system-section">
                        <ConsultantRatingStatistics
                            onNavigate={onNavigate}
                            loading={loading}
                        />
                    </div>
                )}

                {/* 시스템 알림 */}
                {hasNotificationPermission && (
                    <div className="mg-v2-admin-dashboard-system-section">
                        <SystemNotificationSection
                            onNavigate={onNavigate}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardSystem;
