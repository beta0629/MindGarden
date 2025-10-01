import React from 'react';

// 모달 컴포넌트들 import
import ErpReportModal from '../../erp/ErpReportModal';
import PerformanceMetricsModal from '../../statistics/PerformanceMetricsModal';
import SpecialtyManagementModal from '../../consultant/SpecialtyManagementModal';
import RecurringExpenseModal from '../../finance/RecurringExpenseModal';
import StatisticsModal from '../../common/StatisticsModal';

const DashboardModals = ({
    // ERP 보고서 모달
    showErpReport,
    setShowErpReport,
    
    // 성능 지표 모달
    showPerformanceMetrics,
    setShowPerformanceMetrics,
    
    // 전문분야 관리 모달
    showSpecialtyManagement,
    setShowSpecialtyManagement,
    
    // 반복 지출 모달
    showRecurringExpense,
    setShowRecurringExpense,
    
    // 통계 모달
    showStatisticsModal,
    setShowStatisticsModal,
    
    className = '',
    ...props
}) => {
    return (
        <div className={`dashboard-modals ${className}`} {...props}>
            {/* ERP 보고서 모달 */}
            {showErpReport && (
                <ErpReportModal
                    show={showErpReport}
                    onHide={() => setShowErpReport(false)}
                />
            )}

            {/* 성능 지표 모달 */}
            {showPerformanceMetrics && (
                <PerformanceMetricsModal
                    show={showPerformanceMetrics}
                    onHide={() => setShowPerformanceMetrics(false)}
                />
            )}

            {/* 전문분야 관리 모달 */}
            {showSpecialtyManagement && (
                <SpecialtyManagementModal
                    show={showSpecialtyManagement}
                    onHide={() => setShowSpecialtyManagement(false)}
                />
            )}

            {/* 반복 지출 모달 */}
            {showRecurringExpense && (
                <RecurringExpenseModal
                    show={showRecurringExpense}
                    onHide={() => setShowRecurringExpense(false)}
                />
            )}

            {/* 통계 모달 */}
            {showStatisticsModal && (
                <StatisticsModal
                    show={showStatisticsModal}
                    onHide={() => setShowStatisticsModal(false)}
                />
            )}
        </div>
    );
};

export default DashboardModals;