/**
 * IntegratedScheduleSummaryStrip — 통합 스케줄 상단 KPI 요약 스트립
 * Visual SSOT: OperatorLedger / PurchaseSummaryStrip — 3-cell surface strip, no accent bars.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../../../common/UnifiedLoading';
import KpiNumeral from '../../../../dashboard-v2/atoms/KpiNumeral';

const STRIP_ARIA = '통합 스케줄 요약';
const LOADING_TEXT = '불러오는 중…';
const UNIT_COUNT = '건';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalCount
 * @param {number} props.ongoingCount
 * @param {number} props.pendingPaymentCount
 */
const IntegratedScheduleSummaryStrip = ({
  loading = false,
  totalCount = 0,
  ongoingCount = 0,
  pendingPaymentCount = 0
}) => {
  const cells = [
    { id: 'total', label: '전체 매칭', value: totalCount },
    { id: 'ongoing', label: '신규 매칭중', value: ongoingCount },
    { id: 'pending-payment', label: '결제 대기', value: pendingPaymentCount }
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
        </article>
      ))}
    </section>
  );
};

IntegratedScheduleSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  ongoingCount: PropTypes.number,
  pendingPaymentCount: PropTypes.number
};

export default IntegratedScheduleSummaryStrip;
