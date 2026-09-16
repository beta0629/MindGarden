/**
 * OpsApprovalSummaryStrip — 대기 / 오늘 / 반려 KPI
 * Visual SSOT: PurchaseSummaryStrip / SalarySummaryStrip — vertical dividers, surface-secondary.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import KpiNumeral from '../../dashboard-v2/atoms/KpiNumeral';
import { OAC_SUMMARY, OAC_LOADING } from '../../../constants/opsApprovalCenterStrings';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.pendingCount
 * @param {number} props.todayCount
 * @param {number} props.rejectedCount
 */
const OpsApprovalSummaryStrip = ({
  loading = false,
  pendingCount = 0,
  todayCount = 0,
  rejectedCount = 0
}) => {
  const cells = [
    {
      id: 'pending',
      label: OAC_SUMMARY.PENDING_LABEL,
      value: String(pendingCount)
    },
    {
      id: 'today',
      label: OAC_SUMMARY.TODAY_LABEL,
      value: String(todayCount)
    },
    {
      id: 'rejected',
      label: OAC_SUMMARY.REJECTED_LABEL,
      value: String(rejectedCount)
    }
  ];

  return (
    <section
      className="ops-approval-summary"
      data-testid="ops-approval-summary"
      aria-label={OAC_SUMMARY.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article key={cell.id} className="ops-approval-summary__cell">
          <p className="ops-approval-summary__label">{cell.label}</p>
          <div
            className="ops-approval-summary__amount"
            data-testid={`ops-approval-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={OAC_LOADING.INLINE} />
            ) : (
              <KpiNumeral value={cell.value} unit={OAC_SUMMARY.UNIT_COUNT} />
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

OpsApprovalSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  pendingCount: PropTypes.number,
  todayCount: PropTypes.number,
  rejectedCount: PropTypes.number
};

export default OpsApprovalSummaryStrip;
