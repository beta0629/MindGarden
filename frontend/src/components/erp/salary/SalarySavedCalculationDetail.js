/**
 * ADMIN 급여 계산 2nd-stage — 저장된 행 DETAIL (월 횟수 등 읽기 전용).
 * ListTableView 전환 후 사라진 기존 행 상세를 calc stage에서 복원한다.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import {
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL,
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT,
  SALARY_LATE_NOTES_LABELS
} from '../../../constants/salaryConstants';
import {
  SM_SUMMARY,
  SM_TABLE
} from '../../../constants/salaryManagementClinicOsStrings';
import {
  resolveSalaryMonthlySessionCount,
  resolveSalaryLateSessionActions
} from '../../../utils/salaryCalculationDisplay';
import { toDisplayString } from '../../../utils/safeDisplay';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import { formatWonAmount } from '../organisms/moneyCockpit/moneyCockpitData';

/**
 * @param {object} props
 * @param {object|null|undefined} props.calculation — 목록에서 연 저장 계산 행. 없으면 렌더하지 않음.
 * @param {object|null|undefined} [props.lateInfo] — pre-confirm-warning 정규화 결과
 * @param {Function} [props.onRecalc] — (calculation, extraCompletedCount) => void
 * @param {boolean} [props.recalcLoading]
 */
const SalarySavedCalculationDetail = ({
  calculation,
  lateInfo = null,
  onRecalc,
  recalcLoading = false
}) => {
  if (calculation == null || typeof calculation !== 'object') {
    return null;
  }

  const monthlySessionCount = resolveSalaryMonthlySessionCount(calculation);
  const consultantName = calculation.consultantName;
  const period = calculation.calculationPeriod || calculation.period;
  const netSalary = calculation.netSalary;
  const hasNet = netSalary != null && netSalary !== '';
  const { extraCompletedCount, showRecalc } = resolveSalaryLateSessionActions(calculation, lateInfo);

  return (
    <section
      className="salary-management__card salary-calc-block__saved-detail"
      data-testid="salary-saved-calculation-detail"
      aria-label={SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL}
    >
      <dl className="salary-calc-block__preview-grid">
        {consultantName != null && consultantName !== '' ? (
          <>
            <dt className="salary-management__stat-label">{SM_TABLE.COL_CONSULTANT}</dt>
            <dd className="salary-management__stat-value">
              <SafeText>{consultantName}</SafeText>
            </dd>
          </>
        ) : null}
        {period != null && period !== '' ? (
          <>
            <dt className="salary-management__stat-label">{SM_TABLE.COL_PERIOD}</dt>
            <dd className="salary-management__stat-value">
              <SafeText>{period}</SafeText>
            </dd>
          </>
        ) : null}
        <dt className="salary-management__stat-label">
          {SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL}
        </dt>
        <dd
          className="salary-management__stat-value"
          data-testid="salary-saved-calculation-monthly-session-count"
        >
          {toDisplayString(monthlySessionCount)}
          {SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}
        </dd>
        {hasNet ? (
          <>
            <dt className="salary-management__stat-label">{SM_TABLE.COL_NET}</dt>
            <dd className="salary-management__stat-value">
              {formatWonAmount(netSalary)}
              {SM_SUMMARY.UNIT_WON}
            </dd>
          </>
        ) : null}
      </dl>
      {showRecalc ? (
        <div className="salary-calc-block__saved-detail-late" role="status">
          <span className="salary-management__stat-label">
            {SALARY_LATE_NOTES_LABELS.EXTRA_COMPLETED_PREFIX}
            {' '}
            {extraCompletedCount}
            {SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}
          </span>
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            onClick={() => onRecalc?.(calculation, extraCompletedCount)}
            disabled={recalcLoading}
            loading={recalcLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            className={buildErpMgButtonClassName({
              variant: 'secondary',
              size: 'sm',
              loading: recalcLoading
            })}
            data-testid="salary-saved-calculation-recalc"
            preventDoubleClick
          >
            {SALARY_LATE_NOTES_LABELS.RECALC}
          </MGButton>
        </div>
      ) : null}
    </section>
  );
};

SalarySavedCalculationDetail.propTypes = {
  calculation: PropTypes.object,
  lateInfo: PropTypes.object,
  onRecalc: PropTypes.func,
  recalcLoading: PropTypes.bool
};

export default SalarySavedCalculationDetail;
