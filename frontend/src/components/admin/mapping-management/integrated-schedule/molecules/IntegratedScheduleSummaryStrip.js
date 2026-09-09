/**
 * IntegratedScheduleSummaryStrip — 통합 스케줄 상단 KPI 요약 스트립
 * Visual SSOT: OperatorLedger / PurchaseSummaryStrip — 3-cell surface strip, no accent bars.
 * 결제 대기 셀 대기 금액은 AdminDashboard「결제 대기」KPI 와 동일 SSOT
 * (`sumPendingPaymentAmount`).
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../../../common/UnifiedLoading';
import KpiNumeral from '../../../../dashboard-v2/atoms/KpiNumeral';
import { PENDING_PAYMENT_KPI_LABEL } from '../../../../../utils/pendingPaymentAggregation';
import { toSafeNumber } from '../../../../../utils/safeDisplay';

const STRIP_ARIA = '통합 스케줄 요약';
const LOADING_TEXT = '불러오는 중…';
const UNIT_COUNT = '건';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalCount
 * @param {number} props.ongoingCount
 * @param {number} props.pendingPaymentCount
 * @param {number} [props.pendingPaymentAmount]
 */
const IntegratedScheduleSummaryStrip = ({
  loading = false,
  totalCount = 0,
  ongoingCount = 0,
  pendingPaymentCount = 0,
  pendingPaymentAmount = 0
}) => {
  const waitingAmountLabel = `대기 금액 ${toSafeNumber(pendingPaymentAmount, 0).toLocaleString()}원`;

  const cells = [
    { id: 'total', label: '전체 배정', value: totalCount },
    { id: 'ongoing', label: '신규 배정 중', value: ongoingCount },
    {
      id: 'pending-payment',
      label: PENDING_PAYMENT_KPI_LABEL,
      value: pendingPaymentCount,
      caption: waitingAmountLabel
    }
  ];

  return (
    <section
      className="integrated-schedule-summary"
      data-testid="integrated-schedule-summary"
      aria-label={STRIP_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className="integrated-schedule-summary__cell"
        >
          <p className="integrated-schedule-summary__label">{cell.label}</p>
          <div
            className="integrated-schedule-summary__amount"
            data-testid={`integrated-schedule-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={LOADING_TEXT} />
            ) : (
              <KpiNumeral value={String(cell.value)} unit={UNIT_COUNT} />
            )}
          </div>
          {!loading && cell.caption ? (
            <p
              className="integrated-schedule-summary__caption"
              data-testid={`integrated-schedule-summary-${cell.id}-amount`}
            >
              {cell.caption}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
};

IntegratedScheduleSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  ongoingCount: PropTypes.number,
  pendingPaymentCount: PropTypes.number,
  pendingPaymentAmount: PropTypes.number
};

export default IntegratedScheduleSummaryStrip;
