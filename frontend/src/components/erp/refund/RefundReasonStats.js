import React from 'react';
import ErpCard from '../common/ErpCard';

/**
 * 환불 사유별 통계 컴포넌트
 */
const RefundReasonStats = ({ refundReasonStats }) => {
    return (
        <ErpCard title="환불 사유별 통계">
            {refundReasonStats && Object.keys(refundReasonStats).length > 0 ? (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px'
                }}>
                    {Object.entries(refundReasonStats).map(([reason, count]) => (
                        <div key={reason} style={{
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ 
                                fontWeight: '600', 
                                marginBottom: '5px',
                                fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                            }}>
                                {reason}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                                {count}건
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    padding: '20px',
                    fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                }}>
                    환불 사유별 통계가 없습니다.
                </div>
            )}
        </ErpCard>
    );
};

export default RefundReasonStats;
