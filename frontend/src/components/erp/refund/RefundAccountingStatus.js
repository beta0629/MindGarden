import React from 'react';
import ErpCard from '../common/ErpCard';

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
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px'
            }}>
                <div style={{
                    padding: '15px',
                    backgroundColor: '#d4edda',
                    borderRadius: '8px',
                    border: '1px solid #c3e6cb'
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        오늘 처리
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#155724' }}>
                        {accountingStatus.processedToday || 0}건
                    </div>
                </div>

                <div style={{
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        승인 대기
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                        {accountingStatus.pendingApproval || 0}건
                    </div>
                </div>

                <div style={{
                    padding: '15px',
                    backgroundColor: '#e2e3e5',
                    borderRadius: '8px',
                    border: '1px solid #d6d8db'
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        총 환불 금액
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#383d41' }}>
                        {formatCurrency(accountingStatus.totalRefundAmount)}
                    </div>
                </div>
            </div>
        </ErpCard>
    );
};

export default RefundAccountingStatus;
