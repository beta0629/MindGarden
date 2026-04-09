import React from 'react';
import CardContainer from '../../common/CardContainer';
import { ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import './RefundAccountingStatus.css';

/**
 * 회계 처리 현황 컴포넌트
 */
const RefundAccountingStatus = ({ erpSyncStatus = {} }) => {
  const accountingStatus = erpSyncStatus?.accountingStatus || {};

  return (
    <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-accounting-status-title">
      <CardContainer className="mg-v2-erp-refund-panel__card">
        <h3 id="refund-accounting-status-title" className="mg-h4">
          회계 처리 현황
        </h3>
        <div className="mg-v2-card-body">
          <div className="refund-accounting-grid">
            <div className="refund-accounting-card refund-accounting-card--success">
              <div className="refund-accounting-label">오늘 처리</div>
              <div className="refund-accounting-value refund-accounting-value--success">
                <ErpSafeNumber
                  value={accountingStatus.processedToday}
                  formatType={ERP_NUMBER_FORMAT.COUNT}
                />
              </div>
            </div>

            <div className="refund-accounting-card refund-accounting-card--warning">
              <div className="refund-accounting-label">승인 대기</div>
              <div className="refund-accounting-value refund-accounting-value--warning">
                <ErpSafeNumber
                  value={accountingStatus.pendingApproval}
                  formatType={ERP_NUMBER_FORMAT.COUNT}
                />
              </div>
            </div>

            <div className="refund-accounting-card refund-accounting-card--neutral">
              <div className="refund-accounting-label">총 환불 금액</div>
              <div className="refund-accounting-value refund-accounting-value--neutral">
                <ErpSafeNumber
                  value={accountingStatus.totalRefundAmount}
                  formatType={ERP_NUMBER_FORMAT.CURRENCY}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContainer>
    </section>
  );
};

export default RefundAccountingStatus;
