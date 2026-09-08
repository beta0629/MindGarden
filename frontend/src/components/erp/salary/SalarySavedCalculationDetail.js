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
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT
} from '../../../constants/salaryConstants';
import {
  SM_SUMMARY,
  SM_TABLE
} from '../../../constants/salaryManagementClinicOsStrings';
import { resolveSalaryMonthlySessionCount } from '../../../utils/salaryCalculationDisplay';
import { toDisplayString } from '../../../utils/safeDisplay';
import SafeText from '../../common/SafeText';
import { formatWonAmount } from '../organisms/moneyCockpit/moneyCockpitData';

/**
 * @param {object} props
 * @param {object|null|undefined} props.calculation — 목록에서 연 저장 계산 행. 없으면 렌더하지 않음.
 */
const SalarySavedCalculationDetail = ({ calculation }) => {
  if (calculation == null || typeof calculation !== 'object') {
    return null;
  }

  const monthlySessionCount = resolveSalaryMonthlySessionCount(calculation);
  const consultantName = calculation.consultantName;
  const period = calculation.calculationPeriod || calculation.period;
  const netSalary = calculation.netSalary;
  const hasNet = netSalary != null && netSalary !== '';

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
    </section>
  );
};

SalarySavedCalculationDetail.propTypes = {
  calculation: PropTypes.object
};

export default SalarySavedCalculationDetail;
