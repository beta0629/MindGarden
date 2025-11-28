import React from 'react';
import MGButton from '../../common/MGButton';
import { FaSyncAlt, FaCogs, FaBox, FaShoppingCart, FaCheckCircle, FaFileExport, FaRedo } from 'react-icons/fa';
import { RotateCcw, Settings, Package, ShoppingCart, CheckCircle, FileText, RefreshCw } from 'lucide-react';

/**
 * AdminDashboard 액션 버튼 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const AdminDashboardActions = ({
    userPermissions,
    onNavigate,
    onAutoCompleteSchedules,
    onAutoCompleteWithReminder,
    onMergeDuplicateMappings,
    onCreateTestData,
    onCheckSystemStatus,
    onViewLogs,
    onClearCache,
    onCreateBackup,
    loading
}) => {
    const hasSchedulePermission = userPermissions.includes('SCHEDULE_MANAGEMENT');
    const hasMappingPermission = userPermissions.includes('MAPPING_MANAGEMENT');
    const hasSystemPermission = userPermissions.includes('SYSTEM_CONFIG');
    const hasDataPermission = userPermissions.includes('DATA_MANAGEMENT');

    const actionGroups = [
        {
            title: '일정 관리',
            actions: [
                {
                    title: '자동 완료',
                    description: '완료된 일정을 자동으로 처리',
                    icon: <CheckCircle className="mg-v2-icon" />,
                    onClick: onAutoCompleteSchedules,
                    variant: 'primary',
                    permission: hasSchedulePermission
                },
                {
                    title: '리마인더 완료',
                    description: '리마인더와 함께 일정 완료',
                    icon: <RotateCcw className="mg-v2-icon" />,
                    onClick: onAutoCompleteWithReminder,
                    variant: 'secondary',
                    permission: hasSchedulePermission
                }
            ]
        },
        {
            title: '매칭 관리',
            actions: [
                {
                    title: '중복 매칭 병합',
                    description: '중복된 매칭을 병합 처리',
                    icon: <Package className="mg-v2-icon" />,
                    onClick: onMergeDuplicateMappings,
                    variant: 'warning',
                    permission: hasMappingPermission
                }
            ]
        },
        {
            title: '시스템 관리',
            actions: [
                {
                    title: '시스템 상태 확인',
                    description: '전체 시스템 상태를 점검',
                    icon: <Settings className="mg-v2-icon" />,
                    onClick: onCheckSystemStatus,
                    variant: 'info',
                    permission: hasSystemPermission
                },
                {
                    title: '로그 보기',
                    description: '시스템 로그를 확인',
                    icon: <FileText className="mg-v2-icon" />,
                    onClick: onViewLogs,
                    variant: 'outline',
                    permission: hasSystemPermission
                },
                {
                    title: '캐시 초기화',
                    description: '시스템 캐시를 초기화',
                    icon: <RefreshCw className="mg-v2-icon" />,
                    onClick: onClearCache,
                    variant: 'outline',
                    permission: hasSystemPermission
                },
                {
                    title: '백업 생성',
                    description: '시스템 백업을 생성',
                    icon: <Package className="mg-v2-icon" />,
                    onClick: onCreateBackup,
                    variant: 'outline',
                    permission: hasSystemPermission
                }
            ]
        },
        {
            title: '개발 도구',
            actions: [
                {
                    title: '테스트 데이터 생성',
                    description: '개발용 테스트 데이터 생성',
                    icon: <ShoppingCart className="mg-v2-icon" />,
                    onClick: onCreateTestData,
                    variant: 'secondary',
                    permission: hasDataPermission
                }
            ]
        }
    ];

    return (
        <div className="mg-v2-admin-dashboard-actions">
            {actionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="mg-v2-admin-dashboard-action-group">
                    <h3 className="mg-v2-admin-dashboard-action-group-title">
                        {group.title}
                    </h3>
                    <div className="mg-v2-admin-dashboard-action-buttons">
                        {group.actions.map((action, actionIndex) => {
                            if (!action.permission) return null;
                            
                            return (
                                <MGButton
                                    key={actionIndex}
                                    variant={action.variant}
                                    onClick={action.onClick}
                                    loading={loading}
                                    className="mg-v2-admin-dashboard-action-button"
                                >
                                    {action.icon}
                                    <div className="mg-v2-admin-dashboard-action-content">
                                        <span className="mg-v2-admin-dashboard-action-title">
                                            {action.title}
                                        </span>
                                        <span className="mg-v2-admin-dashboard-action-description">
                                            {action.description}
                                        </span>
                                    </div>
                                </MGButton>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminDashboardActions;
