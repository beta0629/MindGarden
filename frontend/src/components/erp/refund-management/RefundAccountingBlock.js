/**
 * 회계 처리 현황 블록 (Organism) — 2nd stage collapsible「회계」(기본 접힘)
 *
 * @author CoreSolution
 * @since 2025-03-16
 * @updated 2026-09-08 Clinic-OS collapsible
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import { ErpSafeNumber, ERP_NUMBER_FORMAT } from '../common';
import {
  RM_COLLAPSE,
  RM_LOADING
} from '../../../constants/refundManagementClinicOsStrings';

const RefundAccountingBlock = ({ erpSyncStatus = {}, isLoading = false }) => {
  const accounting = erpSyncStatus?.accountingStatus || {};
  const processedToday = accounting.processedToday ?? 0;
  const pendingApproval = accounting.pendingApproval ?? 0;
  const totalRefundAmount = accounting.totalRefundAmount ?? 0;

  return (
    <details
      className="refund-management__collapse refund-management__collapse--accounting refund-management__accounting-block"
      aria-busy={isLoading}
    >
      <summary className="refund-management__collapse-summary">
        {RM_COLLAPSE.ACCOUNTING}
      </summary>
      <div className="refund-management__collapse-body refund-management__accounting-content">
        {isLoading ? (
          <UnifiedLoading
            type="inline"
            text={RM_LOADING.PAGE}
            className="refund-management__inline-loading refund-management__inline-loading--section"
            role="status"
            aria-live="polite"
          />
        ) : (
          <>
            <span className="refund-management__accounting-item">
              반영 완료{' '}
              <ErpSafeNumber value={processedToday} formatType={ERP_NUMBER_FORMAT.COUNT} />
            </span>
            <span className="refund-management__accounting-item">
              대기{' '}
              <ErpSafeNumber value={pendingApproval} formatType={ERP_NUMBER_FORMAT.COUNT} />
            </span>
            <span className="refund-management__accounting-item">
              총 환불 금액{' '}
              <ErpSafeNumber value={totalRefundAmount} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
            </span>
            <span className="refund-management__accounting-item refund-management__accounting-item--muted">
              (기간 내 기준)
            </span>
          </>
        )}
      </div>
    </details>
  );
};

RefundAccountingBlock.propTypes = {
  erpSyncStatus: PropTypes.object,
  isLoading: PropTypes.bool
};

export default RefundAccountingBlock;
