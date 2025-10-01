import React from 'react';
import ErpCard from '../common/ErpCard';
import './RefundReasonStats.css';

/**
 * 환불 사유별 통계 컴포넌트
 */
const RefundReasonStats = ({ refundReasonStats }) => {
    return (
        <ErpCard title="환불 사유별 통계">
            {refundReasonStats && Object.keys(refundReasonStats).length > 0 ? (
                <div className="refund-reason-stats-grid">
                    {Object.entries(refundReasonStats).map(([reason, count]) => (
                        <div key={reason} className="refund-reason-stat-card">
                            <div className="refund-reason-stat-label">
                                {reason}
                            </div>
                            <div className="refund-reason-stat-value">
                                {count}건
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="refund-reason-stats-empty">
                    환불 사유별 통계가 없습니다.
                </div>
            )}
        </ErpCard>
    );
};

export default RefundReasonStats;
