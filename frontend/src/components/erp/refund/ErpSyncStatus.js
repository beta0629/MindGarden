import React from 'react';
import ErpCard from '../common/ErpCard';

/**
 * ERP 동기화 상태 컴포넌트
 */
const ErpSyncStatus = ({ erpSyncStatus }) => {
    return (
        <ErpCard title="ERP 동기화 상태">
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px'
            }}>
                <div style={{
                    padding: '15px',
                    backgroundColor: erpSyncStatus.erpSystemAvailable ? '#d4edda' : '#f8d7da',
                    borderRadius: '8px',
                    border: `1px solid ${erpSyncStatus.erpSystemAvailable ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        ERP 시스템 상태
                    </div>
                    <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        color: erpSyncStatus.erpSystemAvailable ? '#155724' : '#721c24'
                    }}>
                        {erpSyncStatus.erpSystemAvailable ? '정상 연결' : '연결 오류'}
                    </div>
                </div>

                <div style={{
                    padding: '15px',
                    backgroundColor: '#d1ecf1',
                    borderRadius: '8px',
                    border: '1px solid #bee5eb'
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        전송 성공률
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0c5460' }}>
                        {erpSyncStatus.erpSuccessRate || 0}%
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
                        대기 중
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                        {erpSyncStatus.pendingErpRequests || 0}건
                    </div>
                </div>

                <div style={{
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb'
                }}>
                    <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '5px',
                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                    }}>
                        실패
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#721c24' }}>
                        {erpSyncStatus.failedErpRequests || 0}건
                    </div>
                </div>
            </div>

            <div style={{ 
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e9ecef',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#6c757d',
                fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
            }}>
                마지막 동기화: {erpSyncStatus.lastSyncTime || '정보 없음'}
            </div>
        </ErpCard>
    );
};

export default ErpSyncStatus;
