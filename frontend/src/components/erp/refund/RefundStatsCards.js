import React from 'react';
import ErpCard from '../common/ErpCard';

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
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
        }}>
            <ErpCard title="환불 건수">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                    {refundStats.summary?.totalRefundCount || 0}건
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {getPeriodLabel(selectedPeriod)} 환불 처리
                </div>
            </ErpCard>

            <ErpCard title="환불 금액">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                    {formatCurrency(refundStats.summary?.totalRefundAmount)}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    평균: {formatCurrency(refundStats.summary?.averageRefundPerCase)}
                </div>
            </ErpCard>

            <ErpCard title="환불 회기">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fd7e14' }}>
                    {refundStats.summary?.totalRefundedSessions || 0}회
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    총 환불된 상담 회기
                </div>
            </ErpCard>

            <ErpCard title="ERP 연동 상태">
                <div style={{
                    padding: '15px',
                    backgroundColor: erpSyncStatus.erpSystemAvailable ? '#d4edda' : '#f8d7da',
                    borderRadius: '8px',
                    border: `1px solid ${erpSyncStatus.erpSystemAvailable ? '#c3e6cb' : '#f5c6cb'}`,
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: erpSyncStatus.erpSystemAvailable ? '#155724' : '#721c24',
                        marginBottom: '5px'
                    }}>
                        {erpSyncStatus.erpSystemAvailable ? '정상' : '오류'}
                    </div>
                    <div style={{ 
                        color: erpSyncStatus.erpSystemAvailable ? '#155724' : '#721c24', 
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}>
                        성공률: {erpSyncStatus.erpSuccessRate || 0}%
                    </div>
                </div>
            </ErpCard>
        </div>
    );
};

export default RefundStatsCards;
