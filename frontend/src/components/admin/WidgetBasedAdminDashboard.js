import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import WelcomeWidget from '../dashboard/widgets/WelcomeWidget';
import './WidgetBasedAdminDashboard.css';

/**
 * 위젯 기반 관리자 대시보드
/**
 * - 데이터베이스에서 위젯 그룹과 위젯 정의를 동적으로 로드
/**
 * - 하드코딩 없이 완전히 동적으로 구성
 */
const WidgetBasedAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
    
    const [loading, setLoading] = useState(true);
    const [widgetGroups, setWidgetGroups] = useState([]);
    const [dashboards, setDashboards] = useState([]);
    const [selectedDashboard, setSelectedDashboard] = useState(null);
    const [error, setError] = useState(null);
    const [fetchAttempts, setFetchAttempts] = useState(0);
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
            setError('대시보드를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
            setLoading(false);
            return;
        }
        
        const fetchDashboards = async () => {
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
                    throw new Error(dashboardResponse.data.message || '대시보드 조회 실패');
                }
            } catch (err) {
                console.error('대시보드 로드 실패:', err);
                setError(err.message);
                notificationManager.error('대시보드 로드 실패', err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDashboards();
    }, [isLoggedIn, sessionLoading]); // user 제거하여 무한루프 방지

    // 위젯 그룹 로드
    const loadWidgetGroups = async (dashboard) => {
        try {
            // 2. 위젯 그룹 조회
            const groupResponse = await axios.get(
                `${API_BASE_URL}/api/v1/widgets/groups`,
                {
                    params: {
                        businessType: 'CONSULTATION',
                        roleCode: 'ADMIN'
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
                    groups.map(async (group) => {
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
                throw new Error(groupResponse.data.message || '위젯 그룹 조회 실패');
            }
        } catch (err) {
            console.error('위젯 그룹 로드 실패:', err);
            notificationManager.error('위젯 그룹 로드 실패', err.message);
        }
    };

    // 위젯 삭제
    const handleDeleteWidget = async (widgetId, groupId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm('이 위젯을 삭제하시겠습니까?', resolve);
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
                notificationManager.success('위젯 삭제 완료', '위젯이 성공적으로 삭제되었습니다.');
                // 위젯 목록 새로고침
                await loadWidgetGroups(selectedDashboard);
            } else {
                throw new Error(response.data.message || '위젯 삭제 실패');
            }
        } catch (err) {
            console.error('위젯 삭제 실패:', err);
            notificationManager.error('위젯 삭제 실패', err.message);
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
                            {widget.description || `${widget.widgetType} 타입의 위젯입니다.`}
                        </p>
                        <div className="widget-meta">
                            <span className="meta-item">
                                <strong>타입:</strong> {widget.widgetType}
                            </span>
                            <span className="meta-item">
                                <strong>순서:</strong> {widget.displayOrder}
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
                                <span className="system-badge">시스템</span>
                            )}
                            {widget.isRequired && (
                                <span className="required-badge">필수</span>
                            )}
                            {widget.isDeletable && (
                                <span className="deletable-badge">삭제가능</span>
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
                                className="btn-delete"
                                onClick={() => handleDeleteWidget(widget.widgetId, groupId)}
                                loading={deletingWidgetId === widget.widgetId}
                                loadingText="삭제 중..."
                                preventDoubleClick
                            >
                                삭제
                            </MGButton>
                        ) : (
                            <span className="no-delete-msg">
                                {widget.isSystemManaged ? '시스템 위젯은 삭제할 수 없습니다' : '필수 위젯은 삭제할 수 없습니다'}
                            </span>
                        )}
                        {widget.isConfigurable && (
                            <button className="btn-config" onClick={() => console.log('설정:', widget.widgetId)}>
                                설정
                            </button>
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
                            {group.widgets?.length || 0}개 위젯
                        </span>
                        {isManageMode && canAddWidget && (
                            <button 
                                className="btn-add-widget"
                                onClick={() => {
                                    setShowAddWidgetModal(true);
                                    // TODO: 그룹 ID 저장
                                }}
                            >
                                + 위젯 추가
                            </button>
                        )}
                    </div>
                </div>
                <div className="widget-grid">
                    {group.widgets && group.widgets.length > 0 ? (
                        group.widgets.map(widget => renderWidget(widget, group.groupId))
                    ) : (
                        <div className="empty-state">
                            <p>이 그룹에는 위젯이 없습니다.</p>
                            {isManageMode && canAddWidget && (
                                <button 
                                    className="btn-add-widget-empty"
                                    onClick={() => setShowAddWidgetModal(true)}
                                >
                                    + 첫 위젯 추가하기
                                </button>
                            )}
                            <small>그룹 ID: {group.groupId}</small>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminCommonLayout title="위젯 기반 대시보드">
            {sessionLoading || loading ? (
                <div className="widget-based-dashboard">
                    <div className="mg-dashboard-loading" aria-busy="true" aria-live="polite">
                        <UnifiedLoading type="inline" text="대시보드를 불러오는 중..." />
                    </div>
                </div>
            ) : error ? (
                <div className="error-container">
                    <h2>오류 발생</h2>
                    <p>{error}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/admin/dashboard-old')}>
                            이전 대시보드로
                        </button>
                        <button onClick={() => window.location.reload()}>
                            다시 시도
                        </button>
                    </div>
                </div>
            ) : (
            <div className="widget-based-dashboard">
                {/* 헤더 */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>위젯 기반 대시보드</h1>
                        <p className="subtitle">동적으로 구성된 관리자 대시보드</p>
                    </div>
                    
                    <div className="header-actions">
                        {/* 대시보드 선택 */}
                        {dashboards.length > 1 && (
                            <div className="dashboard-selector">
                                <label>대시보드:</label>
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
                        <button 
                            className={`btn-manage-mode ${isManageMode ? 'active' : ''}`}
                            onClick={() => setIsManageMode(!isManageMode)}
                        >
                            {isManageMode ? '✓ 관리 모드' : '⚙️ 대시보드 관리'}
                        </button>
                    </div>
                </div>

                {/* 위젯 그룹 */}
                <div className="widget-groups-container">
                    {widgetGroups.length > 0 ? (
                        widgetGroups.map(group => renderWidgetGroup(group))
                    ) : (
                        <div className="empty-state">
                            <h3>위젯이 없습니다</h3>
                            <p>이 대시보드에는 아직 위젯이 구성되지 않았습니다.</p>
                        </div>
                    )}
                </div>

                {/* 통계 정보 */}
                <div className="dashboard-stats">
                    <div className="stat-item">
                        <span className="stat-label">총 위젯 그룹:</span>
                        <span className="stat-value">{widgetGroups.length}개</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">총 위젯:</span>
                        <span className="stat-value">
                            {widgetGroups.reduce((sum, group) => sum + (group.widgets?.length || 0), 0)}개
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">대시보드:</span>
                        <span className="stat-value">{dashboards.length}개</span>
                    </div>
                </div>
            </div>
            )}
        </AdminCommonLayout>
    );
};

export default WidgetBasedAdminDashboard;

