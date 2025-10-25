import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../../hooks';
import { DashboardHeader } from '../common';
import DashboardStats from './components/DashboardStats';
import DashboardManagement from './components/DashboardManagement';
import DashboardModals from './components/DashboardModals';
import SimpleLayout from '../layout/SimpleLayout';
import TodayStatistics from './TodayStatistics';
import SystemStatus from './system/SystemStatus';
import SystemTools from './system/SystemTools';
import ConsultationCompletionStats from './ConsultationCompletionStats';
import VacationStatistics from './VacationStatistics';
import ConsultantRatingStatistics from './ConsultantRatingStatistics';
import PermissionManagement from './PermissionManagement';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/main.css';
import './AdminDashboard.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';

const NewAdminDashboard = ({ user: propUser }) => {
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
    
    // 커스텀 훅 사용
    const {
        // 상태
        userPermissions,
        stats,
        refundStats,
        pendingDepositStats,
        loading,
        showToastState,
        toastMessage,
        toastType,
        systemStatus,
        
        // 모달 상태
        showErpReport,
        setShowErpReport,
        showPerformanceMetrics,
        setShowPerformanceMetrics,
        showSpecialtyManagement,
        setShowSpecialtyManagement,
        showRecurringExpense,
        setShowRecurringExpense,
        showStatisticsModal,
        setShowStatisticsModal,
        
        // 함수들
        showToast,
        loadStats,
        checkSystemStatus,
        navigate: hookNavigate
    } = useAdminDashboard();

    // 통계 클릭 핸들러
    const handleStatClick = (statData) => {
        console.log('통계 클릭:', statData);
        showToast(`${statData.title} 상세 정보를 확인합니다.`, 'info');
    };

    // 네비게이션 핸들러
    const handleNavigate = (path) => {
        hookNavigate(path);
    };

    // 로딩 중일 때
    if (sessionLoading || loading) {
        return (
            <SimpleLayout>
                <div className="loading-container">
                    <UnifiedLoading type="inline" />
                    <p>관리자 대시보드를 불러오는 중...</p>
                </div>
            </SimpleLayout>
        );
    }

    // 로그인되지 않은 경우
    if (!isLoggedIn) {
        return (
            <SimpleLayout>
                <div className="error-container">
                    <h2>접근 권한이 없습니다</h2>
                    <p>관리자 권한이 필요합니다.</p>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="admin-dashboard">
                {/* 대시보드 헤더 */}
                <DashboardHeader />

                <div className="admin-dashboard-content">
                    {/* 시스템 현황 */}
                    <DashboardStats
                        stats={stats}
                        refundStats={refundStats}
                        pendingDepositStats={pendingDepositStats}
                        onStatClick={handleStatClick}
                    />

                    {/* 관리 기능 */}
                    <DashboardManagement
                        onNavigate={handleNavigate}
                        hasPermission={hasPermission}
                        showToast={showToast}
                    />

                    {/* 시스템 상태 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">시스템 상태</h2>
                        <SystemStatus
                            status={systemStatus}
                            onRefresh={checkSystemStatus}
                        />
                    </section>

                    {/* 시스템 도구 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">시스템 도구</h2>
                        <SystemTools />
                    </section>

                    {/* 오늘의 통계 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">오늘의 통계</h2>
                        <TodayStatistics />
                    </section>

                    {/* 상담 완료 통계 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">상담 완료 통계</h2>
                        <ConsultationCompletionStats />
                    </section>

                    {/* 휴가 통계 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">휴가 통계</h2>
                        <VacationStatistics />
                    </section>

                    {/* 상담사 평점 통계 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">상담사 평점 통계</h2>
                        <ConsultantRatingStatistics />
                    </section>

                    {/* 권한 관리 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">권한 관리</h2>
                        <PermissionManagement />
                    </section>
                </div>

                {/* 모달들 */}
                <DashboardModals
                    showErpReport={showErpReport}
                    setShowErpReport={setShowErpReport}
                    showPerformanceMetrics={showPerformanceMetrics}
                    setShowPerformanceMetrics={setShowPerformanceMetrics}
                    showSpecialtyManagement={showSpecialtyManagement}
                    setShowSpecialtyManagement={setShowSpecialtyManagement}
                    showRecurringExpense={showRecurringExpense}
                    setShowRecurringExpense={setShowRecurringExpense}
                    showStatisticsModal={showStatisticsModal}
                    setShowStatisticsModal={setShowStatisticsModal}
                />

                {/* 토스트 메시지 */}
                {showToastState && (
                    <div className={`toast toast-${toastType}`}>
                        {toastMessage}
                    </div>
                )}
            </div>
        </SimpleLayout>
    );
};

export default NewAdminDashboard;
