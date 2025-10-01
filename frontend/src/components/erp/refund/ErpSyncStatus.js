import React from 'react';
import ErpCard from '../common/ErpCard';
import './ErpSyncStatus.css';

/**
 * ERP 동기화 상태 컴포넌트
 */
const ErpSyncStatus = ({ erpSyncStatus }) => {
    return (
        <ErpCard title="ERP 동기화 상태">
            <div className="erp-sync-grid">
                <div className={`erp-sync-card ${erpSyncStatus.erpSystemAvailable ? 'erp-sync-card--success' : 'erp-sync-card--error'}`}>
                    <div className="erp-sync-label">
                        ERP 시스템 상태
                    </div>
                    <div className={`erp-sync-value ${erpSyncStatus.erpSystemAvailable ? 'erp-sync-value--success' : 'erp-sync-value--error'}`}>
                        {erpSyncStatus.erpSystemAvailable ? '정상 연결' : '연결 오류'}
                    </div>
                </div>

                <div className="erp-sync-card erp-sync-card--info">
                    <div className="erp-sync-label">
                        전송 성공률
                    </div>
                    <div className="erp-sync-value erp-sync-value--info">
                        {erpSyncStatus.erpSuccessRate || 0}%
                    </div>
                </div>

                <div className="erp-sync-card erp-sync-card--warning">
                    <div className="erp-sync-label">
                        대기 중
                    </div>
                    <div className="erp-sync-value erp-sync-value--warning">
                        {erpSyncStatus.pendingErpRequests || 0}건
                    </div>
                </div>

                <div className="erp-sync-card erp-sync-card--error">
                    <div className="erp-sync-label">
                        실패
                    </div>
                    <div className="erp-sync-value erp-sync-value--error">
                        {erpSyncStatus.failedErpRequests || 0}건
                    </div>
                </div>
            </div>

            <div className="erp-sync-footer">
                마지막 동기화: {erpSyncStatus.lastSyncTime || '정보 없음'}
            </div>
        </ErpCard>
    );
};

export default ErpSyncStatus;
