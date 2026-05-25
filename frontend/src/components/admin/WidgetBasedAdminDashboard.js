import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import WelcomeWidget from '../dashboard/widgets/WelcomeWidget';
import './WidgetBasedAdminDashboard.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

/**
 * 위젯 기반 관리자 대시보드
/**
 * - 데이터베이스에서 위젯 그룹과 위젯 정의를 동적으로 로드
/**
 * - 하드코딩 없이 완전히 동적으로 구성
 */
const WidgetBasedAdminDashboard = () => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
    
    const [loading, setLoading] = useState(true);
    const [widgetGroups, setWidgetGroups] = useState([]);
    const [dashboards, setDashboards] = useState([]);
    const [selectedDashboard, setSelectedDashboard] = useState(null);
    const [error, setError] = useState(null);
    const [fetchAttempts, setFetchAttempts] = useState(0);
    const [retryKey, setRetryKey] = useState(0);
    const [isManageMode, setIsManageMode] = useState(false); // 관리 모드
    const [availableWidgets, setAvailableWidgets] = useState([]); // 추가 가능한 위젯
    const [showAddWidgetModal, setShowAddWidgetModal] = useState(false); // 위젯 추가 모달
    const [deletingWidgetId, setDeletingWidgetId] = useState(null); // 삭제 중인 위젯 ID
    const MAX_FETCH_ATTEMPTS = 3; // 최대 3회 시도

    // 대시보드 목록 조회
    useEffect(() => {
        if (!isLoggedIn || sessionLoading) return;
        
        // 무한루프 방지
        if (fetchAttempts >= MAX_FETCH_ATTEMPTS) {
            console.error('최대 시도 횟수 초과. 무한루프 방지.');
            setError(t('admin:widgetDashboard.loadFailed', '대시보드를 불러올 수 없습니다. 페이지를 새로고침해주세요.'));
            setLoading(false);
            return;
        }
        
        const fetchDashboards = async() => {
            try {
                setLoading(true);
                setFetchAttempts(prev => prev + 1);
                
                // 1. 대시보드 목록 조회
                const dashboardResponse = await axios.get(
                    `${API_BASE_URL}/api/v1/tenant/dashboards`,
                    { 
                        withCredentials: true,
                        headers: {
                            'X-Tenant-ID': user?.tenantId
                        }
                    }
                );
                
                if (dashboardResponse.data.success) {
                    const dashboardList = dashboardResponse.data.data;
                    setDashboards(dashboardList);
                    
                    // 첫 번째 대시보드 선택 (원장 대시보드)
                    if (dashboardList.length > 0) {
                        setSelectedDashboard(dashboardList[0]);
                        await loadWidgetGroups(dashboardList[0]);
                    }
                } else {
                    throw new Error(dashboardResponse.data.message || t('admin:widgetDashboard.fetchFailedDashboard', '대시보드 조회 실패'));
                }
            } catch (err) {
                console.error('대시보드 로드 실패:', err);
                setError(err.message);
                notificationManager.error(t('admin:widgetDashboard.fetchFailedTitle', '대시보드 로드 실패'), err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDashboards();
    }, [isLoggedIn, sessionLoading, retryKey]); // user 제거하여 무한루프 방지; retryKey로 오류 후 재시도

    const handleDashboardLoadRetry = () => {
        setError(null);
        setFetchAttempts(0);
        setRetryKey((k) => k + 1);
    };

    // 위젯 그룹 로드
    const loadWidgetGroups = async(dashboard) => {
        try {
            // 2. 위젯 그룹 조회
            const groupResponse = await axios.get(
                `${API_BASE_URL}/api/v1/widgets/groups`,
                {
                    params: {
                        businessType: 'CONSULTATION',
                        roleCode: USER_ROLES.ADMIN
                    },
                    withCredentials: true,
                    headers: {
                        'X-Tenant-ID': user?.tenantId
                    }
                }
            );
            
            if (groupResponse.data.success) {
                const groups = groupResponse.data.data;
                
                // 3. 각 그룹의 위젯 정의 조회
                const groupsWithWidgets = await Promise.all(
                    groups.map(async(group) => {
                        try {
                            const widgetResponse = await axios.get(
                                `${API_BASE_URL}/api/v1/widgets/groups/${group.groupId}/widgets`,
                                {
                                    withCredentials: true,
                                    headers: {
                                        'X-Tenant-ID': user?.tenantId
                                    }
                                }
                            );
                            
                            if (widgetResponse.data.success) {
                                return {
                                    ...group,
                                    widgets: widgetResponse.data.data
                                };
                            } else {
                                console.warn(`그룹 ${group.groupId}의 위젯 조회 실패`);
                                return {
                                    ...group,
                                    widgets: []
                                };
                            }
                        } catch (err) {
                            console.error(`그룹 ${group.groupId}의 위젯 조회 오류:`, err);
                            return {
                                ...group,
                                widgets: []
                            };
                        }
                    })
                );
                
                setWidgetGroups(groupsWithWidgets);
            } else {
                throw new Error(groupResponse.data.message || t('admin:widgetDashboard.fetchFailedGroup', '위젯 그룹 조회 실패'));
            }
        } catch (err) {
            console.error('위젯 그룹 로드 실패:', err);
            notificationManager.error(t('admin:widgetDashboard.fetchFailedGroupTitle', '위젯 그룹 로드 실패'), err.message);
        }
    };

    // 위젯 삭제
    const handleDeleteWidget = async(widgetId, groupId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm(t('admin:widgetDashboard.deleteConfirm', '이 위젯을 삭제하시겠습니까?'), resolve);
        });
        if (!confirmed) return;

        setDeletingWidgetId(widgetId);
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/api/v1/widgets/${widgetId}`,
                {
                    withCredentials: true,
                    headers: {
                        'X-Tenant-ID': user?.tenantId
                    }
                }
            );
            
            if (response.data.success) {
                notificationManager.success(t('admin:widgetDashboard.deleteSuccessTitle', '위젯 삭제 완료'), t('admin:widgetDashboard.deleteSuccessMessage', '위젯이 성공적으로 삭제되었습니다.'));
                // 위젯 목록 새로고침
                await loadWidgetGroups(selectedDashboard);
            } else {
                throw new Error(response.data.message || t('admin:widgetDashboard.deleteFailed', '위젯 삭제 실패'));
            }
        } catch (err) {
            console.error('위젯 삭제 실패:', err);
            notificationManager.error(t('admin:widgetDashboard.deleteFailed', '위젯 삭제 실패'), err.message);
        } finally {
            setDeletingWidgetId(null);
        }
    };

    // 위젯 컴포넌트 렌더링
    const renderWidgetComponent = (widget) => {
        // 위젯 타입에 따라 실제 컴포넌트 렌더링
        switch (widget.widgetType) {
            case 'welcome':
                return <WelcomeWidget config={widget.config} />;
            default:
                // 기본 플레이스홀더
                return (
                    <div className="widget-placeholder">
                        <p className="widget-description">
                            {widget.description || t('admin:widgetDashboard.placeholderDescription', '{{type}} 타입의 위젯입니다.', { type: widget.widgetType })}
                        </p>
                        <div className="widget-meta">
                            <span className="meta-item">
                                <strong>{t('admin:widgetDashboard.metaType', '타입')}:</strong> {widget.widgetType}
                            </span>
                            <span className="meta-item">
                                <strong>{t('admin:widgetDashboard.metaOrder', '순서')}:</strong> {widget.displayOrder}
                            </span>
                        </div>
                    </div>
                );
        }
    };

    // 위젯 렌더링
    const renderWidget = (widget, groupId) => {
        console.log('렌더링 위젯:', widget); // 디버깅용
        
        return (
            <div key={widget.widgetId} className={`widget-card ${isManageMode ? 'manage-mode' : ''}`}>
                {/* 관리 모드일 때만 헤더 표시 */}
                {isManageMode && (
                    <div className="widget-header">
                        <h3>{widget.widgetNameKo || widget.widgetName}</h3>
                        <div className="widget-badges">
                            {widget.isSystemManaged && (
                                <span className="system-badge">{t('admin:widgetDashboard.systemBadge', '시스템')}</span>
                            )}
                            {widget.isRequired && (
                                <span className="required-badge">{t('admin:widgetDashboard.requiredBadge', '필수')}</span>
                            )}
                            {widget.isDeletable && (
                                <span className="deletable-badge">{t('admin:widgetDashboard.deletableBadge', '삭제가능')}</span>
                            )}
                        </div>
                    </div>
                )}
                
                {/* 실제 위젯 컴포넌트 */}
                <div className="widget-content">
                    {renderWidgetComponent(widget)}
                </div>
                
                {/* 관리 모드 액션 버튼 */}
                {isManageMode && (
                    <div className="widget-actions">
                        {widget.isDeletable ? (
                            <MGButton
                                variant="danger"
                                size="small"
                                className={buildErpMgButtonClassName({
                                    variant: 'danger',
                                    size: 'sm',
                                    loading: deletingWidgetId === widget.widgetId,
                                    className: 'btn-delete'
                                })}
                                onClick={() => handleDeleteWidget(widget.widgetId, groupId)}
                                loading={deletingWidgetId === widget.widgetId}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick
                            >
                                {t('admin:actions.delete', '삭제')}
                            </MGButton>
                        ) : (
                            <span className="no-delete-msg">
                                {widget.isSystemManaged ? t('admin:widgetDashboard.systemWidgetNoDelete', '시스템 위젯은 삭제할 수 없습니다') : t('admin:widgetDashboard.requiredWidgetNoDelete', '필수 위젯은 삭제할 수 없습니다')}
                            </span>
                        )}
                        {widget.isConfigurable && (
                            <MGButton
                                type="button"
                                variant="primary"
                                size="small"
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'sm',
                                    loading: false,
                                    className: 'btn-config'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => console.log('설정:', widget.widgetId)}
                            >
                                {t('admin:dashboardEditor.config', '설정')}
                            </MGButton>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // 위젯 그룹 렌더링
    const renderWidgetGroup = (group) => {
        console.log('렌더링 그룹:', group); // 디버깅용
        
        const canAddWidget = !group.isSystemManaged; // 시스템 관리 그룹이 아니면 추가 가능
        
        return (
            <div key={group.groupId} className="widget-group">
                <div className="widget-group-header">
                    <div className="group-title-section">
                        <h2>{group.groupNameKo || group.groupName}</h2>
                        <p className="widget-group-description">{group.description}</p>
                    </div>
                    <div className="group-actions">
                        <span className="widget-count-badge">
                            {t('admin:widgetDashboard.widgetCount', '{{count}}개 위젯', { count: group.widgets?.length || 0 })}
                        </span>
                        {isManageMode && canAddWidget && (
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'md',
                                    loading: false,
                                    className: 'btn-add-widget'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => {
                                    setShowAddWidgetModal(true);
                                    // TODO: 그룹 ID 저장
                                }}
                            >
                                {t('admin:widgetDashboard.addWidget', '+ 위젯 추가')}
                            </MGButton>
                        )}
                    </div>
                </div>
                <div className="widget-grid">
                    {group.widgets && group.widgets.length > 0 ? (
                        group.widgets.map(widget => renderWidget(widget, group.groupId))
                    ) : (
                        <div className="empty-state">
                            <p>{t('admin:widgetDashboard.emptyGroup', '이 그룹에는 위젯이 없습니다.')}</p>
                            {isManageMode && canAddWidget && (
                                <MGButton
                                    type="button"
                                    variant="outline"
                                    className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'md',
                                        loading: false,
                                        className: 'btn-add-widget-empty'
                                    })}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    preventDoubleClick={false}
                                    onClick={() => setShowAddWidgetModal(true)}
                                >
                                    {t('admin:widgetDashboard.addFirstWidget', '+ 첫 위젯 추가하기')}
                                </MGButton>
                            )}
                            <small>{t('admin:widgetDashboard.groupIdLabel', '그룹 ID')}: {group.groupId}</small>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminCommonLayout title={t('admin:widgetDashboard.title', '위젯 기반 대시보드')}>
            {sessionLoading || loading ? (
                <div className="widget-based-dashboard">
                    <div className="mg-dashboard-loading" aria-busy="true" aria-live="polite">
                        <UnifiedLoading type="inline" text={t('admin:widgetDashboard.loading', '대시보드를 불러오는 중...')} />
                    </div>
                </div>
            ) : error ? (
                <div className="error-container">
                    <h2>{t('admin:widgetDashboard.errorTitle', '오류 발생')}</h2>
                    <p>{error}</p>
                    <div className="widget-based-dashboard__error-actions">
                        <MGButton
                            type="button"
                            variant="primary"
                            size="medium"
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'md',
                                loading: false
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => navigate('/admin/dashboard-old')}
                        >
                            {t('admin:widgetDashboard.oldDashboard', '이전 대시보드로')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="primary"
                            size="medium"
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'md',
                                loading: false
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={handleDashboardLoadRetry}
                        >
                            {t('common:labels.retry', '다시 시도')}
                        </MGButton>
                    </div>
                </div>
            ) : (
            <div className="widget-based-dashboard">
                {/* 헤더 */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>{t('admin:widgetDashboard.title', '위젯 기반 대시보드')}</h1>
                        <p className="subtitle">{t('admin:widgetDashboard.subtitle', '동적으로 구성된 관리자 대시보드')}</p>
                    </div>
                    
                    <div className="header-actions">
                        {/* 대시보드 선택 */}
                        {dashboards.length > 1 && (
                            <div className="dashboard-selector">
                                <label>{t('admin:lnb.dashboard', '대시보드')}:</label>
                                <select 
                                    value={selectedDashboard?.dashboardId || ''}
                                    onChange={(e) => {
                                        const dashboard = dashboards.find(d => d.dashboardId === e.target.value);
                                        setSelectedDashboard(dashboard);
                                        loadWidgetGroups(dashboard);
                                    }}
                                >
                                    {dashboards.map(dashboard => (
                                        <option key={dashboard.dashboardId} value={dashboard.dashboardId}>
                                            {dashboard.dashboardName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* 관리 모드 토글 */}
                        <MGButton
                            type="button"
                            variant={isManageMode ? 'primary' : 'outline'}
                            size="medium"
                            className={buildErpMgButtonClassName({
                                variant: isManageMode ? 'primary' : 'outline',
                                size: 'md',
                                loading: false,
                                className: `btn-manage-mode ${isManageMode ? 'active' : ''}`
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={false}
                            onClick={() => setIsManageMode(!isManageMode)}
                        >
                            {isManageMode ? t('admin:widgetDashboard.manageMode', '관리 모드') : t('admin:widgetDashboard.manageDashboard', '대시보드 관리')}
                        </MGButton>
                    </div>
                </div>

                {/* 위젯 그룹 */}
                <div className="widget-groups-container">
                    {widgetGroups.length > 0 ? (
                        widgetGroups.map(group => renderWidgetGroup(group))
                    ) : (
                        <div className="empty-state">
                            <h3>{t('admin:widgetDashboard.emptyWidgets', '위젯이 없습니다')}</h3>
                            <p>{t('admin:widgetDashboard.emptyWidgetsDescription', '이 대시보드에는 아직 위젯이 구성되지 않았습니다.')}</p>
                        </div>
                    )}
                </div>

                {/* 통계 정보 */}
                <div className="dashboard-stats">
                    <div className="stat-item">
                        <span className="stat-label">{t('admin:widgetDashboard.totalGroups', '총 위젯 그룹')}:</span>
                        <span className="stat-value">{t('admin:widgetDashboard.countUnit', '{{count}}개', { count: widgetGroups.length })}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('admin:widgetDashboard.totalWidgets', '총 위젯')}:</span>
                        <span className="stat-value">
                            {t('admin:widgetDashboard.countUnit', '{{count}}개', { count: widgetGroups.reduce((sum, group) => sum + (group.widgets?.length || 0), 0) })}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('admin:lnb.dashboard', '대시보드')}:</span>
                        <span className="stat-value">{t('admin:widgetDashboard.countUnit', '{{count}}개', { count: dashboards.length })}</span>
                    </div>
                </div>
            </div>
            )}
        </AdminCommonLayout>
    );
};

export default WidgetBasedAdminDashboard;

