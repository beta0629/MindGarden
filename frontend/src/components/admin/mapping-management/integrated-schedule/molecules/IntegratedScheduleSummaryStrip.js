/**
 * IntegratedScheduleSummaryStrip — 통합 스케줄 상단 KPI 요약 스트립
 * Visual SSOT: OperatorLedger / PurchaseSummaryStrip — 3-cell surface strip, no accent bars.
 * 결제 대기 셀 대기 금액은 AdminDashboard「결제 대기」KPI 와 동일 SSOT
 * (`sumPendingPaymentAmount`).
 * 결제 대기 셀은 actionable — `onPendingPaymentClick` 으로 사이드바 PENDING_PAYMENT 목록 오픈.
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
const PENDING_PAYMENT_CELL_ID = 'pending-payment';
const PENDING_PAYMENT_ACTION_ARIA = '결제 대기 배정 목록 보기';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalCount
 * @param {number} props.ongoingCount
 * @param {number} props.pendingPaymentCount
 * @param {number} [props.pendingPaymentAmount]
 * @param {function} [props.onPendingPaymentClick]
 */
const IntegratedScheduleSummaryStrip = ({
  loading = false,
  totalCount = 0,
  ongoingCount = 0,
  pendingPaymentCount = 0,
  pendingPaymentAmount = 0,
  onPendingPaymentClick
}) => {
  const waitingAmountLabel = `대기 금액 ${toSafeNumber(pendingPaymentAmount, 0).toLocaleString()}원`;

  const cells = [
    { id: 'total', label: '전체 배정', value: totalCount },
    { id: 'ongoing', label: '신규 배정 중', value: ongoingCount },
    {
      id: PENDING_PAYMENT_CELL_ID,
      label: PENDING_PAYMENT_KPI_LABEL,
      value: pendingPaymentCount,
      caption: waitingAmountLabel,
      actionable: typeof onPendingPaymentClick === 'function'
    }
  ];

  const renderCellBody = (cell) => (
    <>
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
    </>
  );

  return (
    <section
      className="integrated-schedule-summary"
      data-testid="integrated-schedule-summary"
      aria-label={STRIP_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        cell.actionable ? (
          <button
            key={cell.id}
            type="button"
            className={
              'integrated-schedule-summary__cell'
              + ' integrated-schedule-summary__cell--action'
            }
            onClick={onPendingPaymentClick}
            aria-label={PENDING_PAYMENT_ACTION_ARIA}
            data-testid={`integrated-schedule-summary-${cell.id}-action`}
            disabled={loading}
          >
            {renderCellBody(cell)}
          </button>
        ) : (
          <article
            key={cell.id}
            className="integrated-schedule-summary__cell"
          >
            {renderCellBody(cell)}
          </article>
        )
      ))}
    </section>
  );
};

IntegratedScheduleSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  ongoingCount: PropTypes.number,
  pendingPaymentCount: PropTypes.number,
  pendingPaymentAmount: PropTypes.number,
  onPendingPaymentClick: PropTypes.func
};

export default IntegratedScheduleSummaryStrip;
