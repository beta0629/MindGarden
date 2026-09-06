/**
 * SalarySummaryStrip — 등록 프로필 / 계산 완료 / 지급 총액 KPI
 * Visual SSOT: PurchaseSummaryStrip / LedgerSummaryStrip — vertical dividers, surface-secondary.
 * 지급 총액 = expense(나간 돈) → semantic-info(blue).
 *
 * @author CoreSolution
 * @since 2026-09-06
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../common/UnifiedLoading';
import KpiNumeral from '../../dashboard-v2/atoms/KpiNumeral';
import { SM_SUMMARY, SM_LOADING } from '../../../constants/salaryManagementClinicOsStrings';
import { formatWonAmount } from '../organisms/moneyCockpit/moneyCockpitData';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.profileCount
 * @param {number} props.calculatedCount
 * @param {number} props.payoutTotal
 */
const SalarySummaryStrip = ({
  loading = false,
  profileCount = 0,
  calculatedCount = 0,
  payoutTotal = 0
}) => {
  const cells = [
    {
      id: 'profiles',
      label: SM_SUMMARY.PROFILES_LABEL,
      value: String(profileCount),
      unit: SM_SUMMARY.UNIT_COUNT,
      amountModifier: ''
    },
    {
      id: 'calculated',
      label: SM_SUMMARY.CALCULATED_LABEL,
      value: String(calculatedCount),
      unit: SM_SUMMARY.UNIT_COUNT,
      amountModifier: ''
    },
    {
      id: 'payout',
      label: SM_SUMMARY.PAYOUT_LABEL,
      value: formatWonAmount(payoutTotal),
      unit: SM_SUMMARY.UNIT_WON,
      amountModifier: 'salary-management-summary__amount--expense',
      cellModifier: 'salary-management-summary__cell--expense'
    }
  ];

  return (
    <section
      className="salary-management-summary"
      data-testid="salary-management-summary"
      aria-label={SM_SUMMARY.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className={`salary-management-summary__cell${cell.cellModifier ? ` ${cell.cellModifier}` : ''}`}
        >
          <p className="salary-management-summary__label">{cell.label}</p>
          <div
            className={`salary-management-summary__amount${cell.amountModifier ? ` ${cell.amountModifier}` : ''}`}
            data-testid={`salary-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={SM_LOADING.INLINE} />
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

SalarySummaryStrip.propTypes = {
  loading: PropTypes.bool,
  profileCount: PropTypes.number,
  calculatedCount: PropTypes.number,
  payoutTotal: PropTypes.number
};

export default SalarySummaryStrip;
