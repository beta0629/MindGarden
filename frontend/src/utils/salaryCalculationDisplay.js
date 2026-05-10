import {
  SALARY_CALC_DETAIL_BASE_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL,
  SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL,
  SALARY_CALC_DETAIL_OPTION_LABEL
} from '../constants/salaryConstants';

/**
 * 급여 계산 API 한 건에서 세전 구성 행 목록을 만든다.
 * 기본급과 상담(건당) 급여가 동일 원단위로 중복 저장된 경우 한 줄로 합쳐 옵션 포함처럼 보이는 문제를 막는다.
 *
 * @param {object} calculation
 * @param {(v: unknown) => number} toNum
 * @returns {Array<{ label: string, amount: number }>}
 */
export function buildSalaryCalculationComponentRows(calculation, toNum) {
  const base = toNum(calculation?.baseSalary);
  const comm = toNum(calculation?.commissionEarnings);
  const hourly = toNum(calculation?.hourlyEarnings);
  const dupBaseAndCommission = base > 0 && comm > 0 && Math.round(base) === Math.round(comm);
  if (dupBaseAndCommission) {
    return [{ label: SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL, amount: base }];
  }
  const rows = [];
  if (base > 0) {
    rows.push({ label: SALARY_CALC_DETAIL_BASE_LABEL, amount: base });
  }
  if (comm > 0 && hourly > 0) {
    rows.push({ label: SALARY_CALC_DETAIL_OPTION_LABEL, amount: comm + hourly });
  } else if (comm > 0) {
    rows.push({ label: SALARY_CALC_DETAIL_CONSULTATION_LABEL, amount: comm });
  } else if (hourly > 0) {
    rows.push({ label: SALARY_CALC_DETAIL_HOURLY_LABEL, amount: hourly });
  }
  return rows;
}
