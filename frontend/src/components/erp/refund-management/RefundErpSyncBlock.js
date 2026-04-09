/**
 * ERP 연동 상태 블록 (Organism)
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';

const RefundErpSyncBlock = ({ erpSyncStatus = {} }) => {
  const status = erpSyncStatus || {};
  const available = Boolean(status.erpSystemAvailable);
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
          <ErpSafeText value={available ? '연동 정상' : '연결 오류'} />
          {' · 마지막 동기화: '}
          <ErpSafeText value={status.lastSyncTime} fallback="정보 없음" />
          {' · 미반영 건: '}
          <ErpSafeNumber value={pending} formatType={ERP_NUMBER_FORMAT.COUNT} />
          {failed > 0 ? (
            <>
              {' · 실패 '}
              <ErpSafeNumber value={failed} formatType={ERP_NUMBER_FORMAT.COUNT} />
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
};

export default RefundErpSyncBlock;
