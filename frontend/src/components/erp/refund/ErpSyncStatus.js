import React from 'react';
import CardContainer from '../../common/CardContainer';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import './ErpSyncStatus.css';

/**
 * ERP 동기화 상태 컴포넌트
 */
const ErpSyncStatus = ({ erpSyncStatus = {} }) => {
  const available = Boolean(erpSyncStatus?.erpSystemAvailable);

  return (
    <section className="mg-v2-erp-refund-panel" aria-labelledby="erp-sync-status-title">
      <CardContainer className="mg-v2-erp-refund-panel__card">
        <h3 id="erp-sync-status-title" className="mg-h4">
          ERP 동기화 상태
        </h3>
        <div className="mg-v2-card-body">
          <div className="erp-sync-grid">
            <div
              className={`erp-sync-card ${available ? 'erp-sync-card--success' : 'erp-sync-card--error'}`}
            >
              <div className="erp-sync-label">ERP 시스템 상태</div>
              <div
                className={`erp-sync-value ${available ? 'erp-sync-value--success' : 'erp-sync-value--error'}`}
              >
                <ErpSafeText value={available ? '정상 연결' : '연결 오류'} />
              </div>
            </div>

            <div className="erp-sync-card erp-sync-card--info">
              <div className="erp-sync-label">전송 성공률</div>
              <div className="erp-sync-value erp-sync-value--info">
                <ErpSafeNumber
                  value={erpSyncStatus?.erpSuccessRate}
                  formatType={ERP_NUMBER_FORMAT.PERCENT}
                />
              </div>
            </div>

            <div className="erp-sync-card erp-sync-card--warning">
              <div className="erp-sync-label">대기 중</div>
              <div className="erp-sync-value erp-sync-value--warning">
                <ErpSafeNumber
                  value={erpSyncStatus?.pendingErpRequests}
                  formatType={ERP_NUMBER_FORMAT.COUNT}
                />
              </div>
            </div>

            <div className="erp-sync-card erp-sync-card--error">
              <div className="erp-sync-label">실패</div>
              <div className="erp-sync-value erp-sync-value--error">
                <ErpSafeNumber
                  value={erpSyncStatus?.failedErpRequests}
                  formatType={ERP_NUMBER_FORMAT.COUNT}
                />
              </div>
            </div>
          </div>

          <div className="erp-sync-footer">
            마지막 동기화:{' '}
            <ErpSafeText value={erpSyncStatus?.lastSyncTime} fallback="정보 없음" />
          </div>
        </div>
      </CardContainer>
    </section>
  );
};

export default ErpSyncStatus;
