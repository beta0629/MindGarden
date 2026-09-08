/**
 * RefundSummaryStrip — 환불 건수 / 환불 금액(expense) / ERP 미반영
 * Visual SSOT: PurchaseSummaryStrip / SalarySummaryStrip — vertical dividers, surface-secondary.
 * 환불 금액 = money-expense blue. CTA teal과 혼용 금지.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import KpiNumeral from '../../dashboard-v2/atoms/KpiNumeral';
import { RM_SUMMARY, RM_LOADING } from '../../../constants/refundManagementClinicOsStrings';
import { formatWonAmount } from '../organisms/moneyCockpit/moneyCockpitData';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalRefundCount
 * @param {number} props.totalRefundAmount
 * @param {number} props.pendingErpCount
 */
const RefundSummaryStrip = ({
  loading = false,
  totalRefundCount = 0,
  totalRefundAmount = 0,
  pendingErpCount = 0
}) => {
  const cells = [
    {
      id: 'count',
      label: RM_SUMMARY.COUNT_LABEL,
      value: String(totalRefundCount),
      unit: RM_SUMMARY.UNIT_COUNT,
      amountModifier: 'refund-management-summary__amount--count',
      cellModifier: ''
    },
    {
      id: 'amount',
      label: RM_SUMMARY.AMOUNT_LABEL,
      value: formatWonAmount(totalRefundAmount),
      unit: RM_SUMMARY.UNIT_WON,
      amountModifier: 'refund-management-summary__amount--expense',
      cellModifier: 'refund-management-summary__cell--expense'
    },
    {
      id: 'pending-erp',
      label: RM_SUMMARY.PENDING_ERP_LABEL,
      value: String(pendingErpCount),
      unit: RM_SUMMARY.UNIT_COUNT,
      amountModifier: 'refund-management-summary__amount--pending-erp',
      cellModifier: ''
    }
  ];

  return (
    <section
      className="refund-management-summary"
      data-testid="refund-management-summary"
      aria-label={RM_SUMMARY.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className={`refund-management-summary__cell${cell.cellModifier ? ` ${cell.cellModifier}` : ''}`}
        >
          <p className="refund-management-summary__label">{cell.label}</p>
          <div
            className={`refund-management-summary__amount${cell.amountModifier ? ` ${cell.amountModifier}` : ''}`}
            data-testid={`refund-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={RM_LOADING.INLINE} />
            ) : (
              <KpiNumeral
                value={cell.value}
                unit={cell.unit}
              />
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

RefundSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalRefundCount: PropTypes.number,
  totalRefundAmount: PropTypes.number,
  pendingErpCount: PropTypes.number
};

export default RefundSummaryStrip;
