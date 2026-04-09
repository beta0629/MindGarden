import React from 'react';
import CardContainer from '../../common/CardContainer';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import { toSafeNumber } from '../../../utils/safeDisplay';
import './RefundStatsCards.css';

/**
 * 환불 통계 카드 컴포넌트
 */
const RefundStatsCards = ({ refundStats = {}, selectedPeriod, erpSyncStatus = {} }) => {
  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today':
        return '오늘';
      case 'week':
        return '최근 7일';
      case 'month':
        return '최근 1개월';
      case 'quarter':
        return '최근 3개월';
      case 'year':
        return '최근 1년';
      default:
        return '최근 1개월';
    }
  };

  const summary = refundStats?.summary || {};
  const sessionsFormatted = `${new Intl.NumberFormat('ko-KR').format(
    toSafeNumber(summary.totalRefundedSessions)
  )}회`;

  return (
    <div className="refund-stats-grid">
      <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-stats-count-title">
        <CardContainer className="mg-v2-erp-refund-panel__card">
          <h3 id="refund-stats-count-title" className="mg-h4">
            환불 건수
          </h3>
          <div className="mg-v2-card-body">
            <div className="refund-stats-value refund-stats-value--danger">
              <ErpSafeNumber value={summary.totalRefundCount} formatType={ERP_NUMBER_FORMAT.COUNT} />
            </div>
            <div className="refund-stats-label">
              <ErpSafeText value={getPeriodLabel(selectedPeriod)} /> 환불 처리
            </div>
          </div>
        </CardContainer>
      </section>

      <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-stats-amount-title">
        <CardContainer className="mg-v2-erp-refund-panel__card">
          <h3 id="refund-stats-amount-title" className="mg-h4">
            환불 금액
          </h3>
          <div className="mg-v2-card-body">
            <div className="refund-stats-value refund-stats-value--purple">
              <ErpSafeNumber value={summary.totalRefundAmount} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
            </div>
            <div className="refund-stats-label">
              평균:{' '}
              <ErpSafeNumber
                value={summary.averageRefundPerCase}
                formatType={ERP_NUMBER_FORMAT.CURRENCY}
              />
            </div>
          </div>
        </CardContainer>
      </section>

      <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-stats-sessions-title">
        <CardContainer className="mg-v2-erp-refund-panel__card">
          <h3 id="refund-stats-sessions-title" className="mg-h4">
            환불 회기
          </h3>
          <div className="mg-v2-card-body">
            <div className="refund-stats-value refund-stats-value--orange">
              <ErpSafeText value={sessionsFormatted} />
            </div>
            <div className="refund-stats-label">총 환불된 상담 회기</div>
          </div>
        </CardContainer>
      </section>

      <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-stats-sync-title">
        <CardContainer className="mg-v2-erp-refund-panel__card">
          <h3 id="refund-stats-sync-title" className="mg-h4">
            연동 상태
          </h3>
          <div className="mg-v2-card-body">
            <div
              className={`refund-erp-sync-status ${
                erpSyncStatus?.erpSystemAvailable
                  ? 'refund-erp-sync-status--available'
                  : 'refund-erp-sync-status--error'
              }`}
            >
              <div className="refund-erp-sync-status-icon">
                <ErpSafeText value={erpSyncStatus?.erpSystemAvailable ? '정상' : '오류'} />
              </div>
              <div className="refund-erp-sync-status-message">
                성공률:{' '}
                <ErpSafeNumber
                  value={erpSyncStatus?.erpSuccessRate}
                  formatType={ERP_NUMBER_FORMAT.PERCENT}
                />
              </div>
            </div>
          </div>
        </CardContainer>
      </section>
    </div>
  );
};

export default RefundStatsCards;
