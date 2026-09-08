/**
 * SalarySummaryStrip — 지급 예정(owed) / 공제 / 승인대기 KPI
 * Visual SSOT: PurchaseSummaryStrip / LedgerSummaryStrip — vertical dividers, surface-secondary.
 * 지급 예정 = operator owed → var(--color-red-700). expense blue 금지.
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
 * @param {number} props.owedTotal — 미지급(CALCULATED+APPROVED 등) net 합
 * @param {number} props.deductionTotal — 동일 범위 원천 공제(국세+지방세) 합
 * @param {number} props.pendingApprovalCount — CALCULATED 건수
 */
const SalarySummaryStrip = ({
  loading = false,
  owedTotal = 0,
  deductionTotal = 0,
  pendingApprovalCount = 0
}) => {
  const cells = [
    {
      id: 'owed',
      label: SM_SUMMARY.OWED_LABEL,
      value: formatWonAmount(owedTotal),
      unit: SM_SUMMARY.UNIT_WON,
      amountModifier: 'salary-management-summary__amount--owed',
      cellModifier: 'salary-management-summary__cell--owed'
    },
    {
      id: 'deduction',
      label: SM_SUMMARY.DEDUCTION_LABEL,
      value: formatWonAmount(deductionTotal),
      unit: SM_SUMMARY.UNIT_WON,
      amountModifier: 'salary-management-summary__amount--deduction',
      cellModifier: ''
    },
    {
      id: 'pending-approval',
      label: SM_SUMMARY.PENDING_APPROVAL_LABEL,
      value: String(pendingApprovalCount),
      unit: SM_SUMMARY.UNIT_COUNT,
      amountModifier: 'salary-management-summary__amount--pending-count',
      cellModifier: ''
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
  owedTotal: PropTypes.number,
  deductionTotal: PropTypes.number,
  pendingApprovalCount: PropTypes.number
};

export default SalarySummaryStrip;
