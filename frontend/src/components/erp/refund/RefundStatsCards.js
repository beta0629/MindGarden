import React from 'react';
import ErpCard from '../common/ErpCard';
import './RefundStatsCards.css';

/**
 * 환불 통계 카드 컴포넌트
 */
const RefundStatsCards = ({ refundStats, selectedPeriod, erpSyncStatus }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
    };

    const getPeriodLabel = (period) => {
        switch (period) {
            case 'today': return '오늘';
            case 'week': return '최근 7일';
            case 'month': return '최근 1개월';
            case 'quarter': return '최근 3개월';
            case 'year': return '최근 1년';
            default: return '최근 1개월';
        }
    };

    return (
        <div className="refund-stats-grid">
            <ErpCard title="환불 건수">
                <div className="refund-stats-value refund-stats-value--danger">
                    {refundStats.summary?.totalRefundCount || 0}건
                </div>
                <div className="refund-stats-label">
                    {getPeriodLabel(selectedPeriod)} 환불 처리
                </div>
            </ErpCard>

            <ErpCard title="환불 금액">
                <div className="refund-stats-value refund-stats-value--purple">
                    {formatCurrency(refundStats.summary?.totalRefundAmount)}
                </div>
                <div className="refund-stats-label">
                    평균: {formatCurrency(refundStats.summary?.averageRefundPerCase)}
                </div>
            </ErpCard>

            <ErpCard title="환불 회기">
                <div className="refund-stats-value refund-stats-value--orange">
                    {refundStats.summary?.totalRefundedSessions || 0}회
                </div>
                <div className="refund-stats-label">
                    총 환불된 상담 회기
                </div>
            </ErpCard>

            <ErpCard title="ERP 연동 상태">
                <div className={`refund-erp-sync-status ${erpSyncStatus.erpSystemAvailable ? 'refund-erp-sync-status--available' : 'refund-erp-sync-status--error'}`}>
                    <div className="refund-erp-sync-status-icon">
                        {erpSyncStatus.erpSystemAvailable ? '정상' : '오류'}
                    </div>
                    <div className="refund-erp-sync-status-message">
                        성공률: {erpSyncStatus.erpSuccessRate || 0}%
                    </div>
                </div>
            </ErpCard>
        </div>
    );
};

export default RefundStatsCards;
