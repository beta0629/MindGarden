/**
 * PurchaseSummaryStrip — 비품 품목 / 구매 요청 / 구매 주문 건수 KPI
 * Visual SSOT: LedgerSummaryStrip / MoneyHeroBand — vertical dividers, surface-secondary.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import KpiNumeral from '../../dashboard-v2/atoms/KpiNumeral';
import { PM_SUMMARY, PM_LOADING } from '../../../constants/purchaseManagementStrings';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.itemCount
 * @param {number} props.requestCount
 * @param {number} props.orderCount
 */
const PurchaseSummaryStrip = ({
  loading = false,
  itemCount = 0,
  requestCount = 0,
  orderCount = 0
}) => {
  const cells = [
    {
      id: 'items',
      label: PM_SUMMARY.ITEMS_LABEL,
      value: itemCount
    },
    {
      id: 'requests',
      label: PM_SUMMARY.REQUESTS_LABEL,
      value: requestCount
    },
    {
      id: 'orders',
      label: PM_SUMMARY.ORDERS_LABEL,
      value: orderCount
    }
  ];

  return (
    <section
      className="purchase-management-summary"
      data-testid="purchase-management-summary"
      aria-label={PM_SUMMARY.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className="purchase-management-summary__cell"
        >
          <p className="purchase-management-summary__label">{cell.label}</p>
          <div
            className="purchase-management-summary__amount"
            data-testid={`purchase-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={PM_LOADING.INLINE} />
            ) : (
              <KpiNumeral
                value={String(cell.value)}
                unit={PM_SUMMARY.UNIT_COUNT}
              />
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

PurchaseSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  itemCount: PropTypes.number,
  requestCount: PropTypes.number,
  orderCount: PropTypes.number
};

export default PurchaseSummaryStrip;
