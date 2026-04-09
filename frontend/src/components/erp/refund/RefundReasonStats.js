import React from 'react';
import CardContainer from '../../common/CardContainer';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import './RefundReasonStats.css';

/**
 * 환불 사유별 통계 컴포넌트
 */
const RefundReasonStats = ({ refundReasonStats }) => {
  return (
    <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-reason-stats-title">
      <CardContainer className="mg-v2-erp-refund-panel__card">
        <h3 id="refund-reason-stats-title" className="mg-h4">
          환불 사유별 통계
        </h3>
        <div className="mg-v2-card-body">
          {refundReasonStats && Object.keys(refundReasonStats).length > 0 ? (
            <div className="refund-reason-stats-grid">
              {Object.entries(refundReasonStats).map(([reason, count]) => (
                <div key={reason} className="refund-reason-stat-card">
                  <div className="refund-reason-stat-label">
                    <ErpSafeText value={reason} />
                  </div>
                  <div className="refund-reason-stat-value">
                    <ErpSafeNumber value={count} formatType={ERP_NUMBER_FORMAT.COUNT} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="refund-reason-stats-empty">환불 사유별 통계가 없습니다.</div>
          )}
        </div>
      </CardContainer>
    </section>
  );
};

export default RefundReasonStats;
