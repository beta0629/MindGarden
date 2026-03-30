/**
 * 회계 처리 현황 블록 (Organism)
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';

const RefundAccountingBlock = ({ erpSyncStatus }) => {
  const accounting = erpSyncStatus?.accountingStatus || {};
  const processedToday = accounting.processedToday ?? 0;
  const pendingApproval = accounting.pendingApproval ?? 0;
  const totalRefundAmount = accounting.totalRefundAmount ?? 0;

  return (
    <section
      className="refund-management__accounting-block"
      aria-labelledby="refund-accounting-heading"
    >
      <h2 id="refund-accounting-heading" className="refund-management__section-title">
        회계 처리 현황
      </h2>
      <div className="refund-management__accounting-content">
        <span className="refund-management__accounting-item">
          반영 완료 {processedToday}건
        </span>
        <span className="refund-management__accounting-item">
          대기 {pendingApproval}건
        </span>
        <span className="refund-management__accounting-item">
          총 환불 금액 {formatCurrency(totalRefundAmount)}
        </span>
        <span className="refund-management__accounting-item refund-management__accounting-item--muted">
          (기간 내 기준)
        </span>
      </div>
    </section>
  );
};

export default RefundAccountingBlock;
