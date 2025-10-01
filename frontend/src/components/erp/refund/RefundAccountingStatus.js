import React from 'react';
import ErpCard from '../common/ErpCard';
import './RefundAccountingStatus.css';

/**
 * 회계 처리 현황 컴포넌트
 */
const RefundAccountingStatus = ({ erpSyncStatus }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
    };

    const accountingStatus = erpSyncStatus.accountingStatus || {};

    return (
        <ErpCard title="회계 처리 현황">
            <div className="refund-accounting-grid">
                <div className="refund-accounting-card refund-accounting-card--success">
                    <div className="refund-accounting-label">
                        오늘 처리
                    </div>
                    <div className="refund-accounting-value refund-accounting-value--success">
                        {accountingStatus.processedToday || 0}건
                    </div>
                </div>

                <div className="refund-accounting-card refund-accounting-card--warning">
                    <div className="refund-accounting-label">
                        승인 대기
                    </div>
                    <div className="refund-accounting-value refund-accounting-value--warning">
                        {accountingStatus.pendingApproval || 0}건
                    </div>
                </div>

                <div className="refund-accounting-card refund-accounting-card--neutral">
                    <div className="refund-accounting-label">
                        총 환불 금액
                    </div>
                    <div className="refund-accounting-value refund-accounting-value--neutral">
                        {formatCurrency(accountingStatus.totalRefundAmount)}
                    </div>
                </div>
            </div>
        </ErpCard>
    );
};

export default RefundAccountingStatus;
