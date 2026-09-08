/**
 * 환불 사유별 통계 블록 (Organism) — 2nd stage collapsible (기본 접힘)
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

const RefundReasonStatsBlock = ({ refundReasonStats, isLoading = false }) => {
  const entries =
    refundReasonStats && typeof refundReasonStats === 'object'
      ? Object.entries(refundReasonStats)
      : [];
  const total = entries.reduce((sum, [, count]) => sum + (Number(count) || 0), 0);

  return (
    <details
      className="refund-management__collapse refund-management__collapse--reason refund-management__reason-stats-block"
      aria-busy={isLoading}
    >
      <summary className="refund-management__collapse-summary">
        {RM_COLLAPSE.REASON}
      </summary>
      <div className="refund-management__collapse-body">
        {isLoading ? (
          <UnifiedLoading
            type="inline"
            text={RM_LOADING.PAGE}
            className="refund-management__inline-loading refund-management__inline-loading--section"
            role="status"
            aria-live="polite"
          />
        ) : entries.length > 0 ? (
          <table className="refund-management__reason-stats-table" role="table">
            <thead>
              <tr>
                <th scope="col">사유</th>
                <th scope="col">건수</th>
                <th scope="col">비율</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([reason, count]) => {
                const num = Number(count) || 0;
                const ratioNum = total > 0 ? (num / total) * 100 : 0;
                return (
                  <tr key={reason}>
                    <td>
                      <ErpSafeText value={reason} />
                    </td>
                    <td>
                      <ErpSafeNumber value={num} formatType={ERP_NUMBER_FORMAT.COUNT} />
                    </td>
                    <td>
                      <ErpSafeNumber value={ratioNum} formatType={ERP_NUMBER_FORMAT.PERCENT} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="refund-management__reason-stats-empty">환불 사유별 통계가 없습니다.</p>
        )}
      </div>
    </details>
  );
};

RefundReasonStatsBlock.propTypes = {
  refundReasonStats: PropTypes.object,
  isLoading: PropTypes.bool
};

export default RefundReasonStatsBlock;
