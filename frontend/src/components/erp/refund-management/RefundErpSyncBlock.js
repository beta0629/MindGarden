/**
 * ERP 연동 상태 블록 (Organism) — 2nd stage collapsible「ERP 상세」(기본 접힘)
 *
 * @author CoreSolution
 * @since 2025-03-16
 * @updated 2026-09-08 Clinic-OS collapsible
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import {
  RM_COLLAPSE,
  RM_LOADING
} from '../../../constants/refundManagementClinicOsStrings';

const RefundErpSyncBlock = ({ erpSyncStatus = {}, isLoading = false }) => {
  const status = erpSyncStatus || {};
  const available = Boolean(status.erpSystemAvailable);
  const pending = status.pendingErpRequests ?? 0;
  const failed = status.failedErpRequests ?? 0;

  return (
    <details
      className="refund-management__collapse refund-management__collapse--erp refund-management__erp-sync-block"
      aria-busy={isLoading}
    >
      <summary className="refund-management__collapse-summary">
        {RM_COLLAPSE.ERP}
      </summary>
      <div className="refund-management__collapse-body refund-management__erp-sync-content">
        {isLoading ? (
          <UnifiedLoading
            type="inline"
            text={RM_LOADING.PAGE}
            className="refund-management__inline-loading refund-management__inline-loading--section"
            role="status"
            aria-live="polite"
          />
        ) : (
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
        )}
      </div>
    </details>
  );
};

RefundErpSyncBlock.propTypes = {
  erpSyncStatus: PropTypes.object,
  isLoading: PropTypes.bool
};

export default RefundErpSyncBlock;
