/**
 * 환불 KPI 블록 (Organism)
 * 환불 건수, 환불 금액, 환불 회기, 연동 상태 4열 카드
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';

const PERIOD_LABELS = {
  today: '오늘',
  week: '최근 7일',
  month: '최근 1개월',
  quarter: '최근 3개월',
  year: '최근 1년'
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';

const RefundKpiBlock = ({ refundStats, selectedPeriod, erpSyncStatus }) => {
  const summary = refundStats?.summary || {};
  const periodLabel = PERIOD_LABELS[selectedPeriod] || '최근 1개월';

  return (
    <section
      className="refund-management__kpi-block"
      aria-labelledby="refund-kpi-heading"
    >
      <h2 id="refund-kpi-heading" className="sr-only">
        환불 현황 요약
      </h2>
      <div className="refund-management__kpi-grid">
        <div className="refund-management__stat-card refund-management__stat-card--accent-primary">
          <span className="refund-management__stat-label" id="refund-stat-count-label">
            환불 건수
          </span>
          <span className="refund-management__stat-value" aria-labelledby="refund-stat-count-label">
            {summary.totalRefundCount ?? 0}건
          </span>
          <span className="refund-management__stat-label">{periodLabel} 환불 처리</span>
        </div>

        <div className="refund-management__stat-card refund-management__stat-card--accent-accent">
          <span className="refund-management__stat-label">환불 금액(원)</span>
          <span className="refund-management__stat-value">
            {formatCurrency(summary.totalRefundAmount)}
          </span>
          <span className="refund-management__stat-label">
            평균: {formatCurrency(summary.averageRefundPerCase)}
          </span>
        </div>

        <div className="refund-management__stat-card refund-management__stat-card--accent-secondary">
          <span className="refund-management__stat-label">환불 회기</span>
          <span className="refund-management__stat-value">
            {summary.totalRefundedSessions ?? 0}회
          </span>
          <span className="refund-management__stat-label">총 환불된 상담 회기</span>
        </div>

        <div className="refund-management__stat-card refund-management__stat-card--accent-primary">
          <span className="refund-management__stat-label">ERP 연동 상태</span>
          <span className="refund-management__stat-value">
            {erpSyncStatus?.erpSystemAvailable ? '연동 완료' : '오류'}
          </span>
          <span className="refund-management__stat-label">
            성공률: {erpSyncStatus?.erpSuccessRate ?? 0}%
          </span>
        </div>
      </div>
    </section>
  );
};

export default RefundKpiBlock;
