/**
 * ERP 연동 상태 블록 (Organism)
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';

const RefundErpSyncBlock = ({ erpSyncStatus }) => {
  const status = erpSyncStatus || {};
  const available = status.erpSystemAvailable;
  const lastSync = status.lastSyncTime || '정보 없음';
  const pending = status.pendingErpRequests ?? 0;
  const failed = status.failedErpRequests ?? 0;

  return (
    <section
      className="refund-management__erp-sync-block"
      aria-labelledby="refund-erp-sync-heading"
    >
      <h2 id="refund-erp-sync-heading" className="refund-management__section-title">
        ERP 연동 상태
      </h2>
      <div className="refund-management__erp-sync-content">
        <p>
          {available ? '연동 정상' : '연결 오류'} · 마지막 동기화: {lastSync} · 미반영 건: {pending}건
          {failed > 0 && ` · 실패 ${failed}건`}
        </p>
      </div>
    </section>
  );
};

export default RefundErpSyncBlock;
