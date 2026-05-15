import {
  SALARY_CALC_DETAIL_BASE_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL,
  SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL,
  SALARY_CALC_DETAIL_OPTION_LABEL
} from '../constants/salaryConstants';

/**
 * ERP·관리자 급여 API에서 내려오는 status를 SALARY_STATUS와 비교 가능한 대문자 문자열로 맞춘다.
 * (Jackson Map 직렬화·레거시 래핑 등으로 문자열이 아닐 수 있음)
 *
 * @param {unknown} raw
 * @returns {string} 예: 'CALCULATED', 없으면 ''
 */
export function normalizeSalaryCalculationStatus(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) {
      return '';
    }
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        return normalizeSalaryCalculationStatus(JSON.parse(s));
      } catch {
        return s.toUpperCase();
      }
    }
    return s.toUpperCase();
  }
  if (typeof raw === 'object') {
    const o = raw;
    if (typeof o.name === 'string' && o.name.trim()) {
      return o.name.trim().toUpperCase();
    }
    if (typeof o.status === 'string' && o.status.trim()) {
      return o.status.trim().toUpperCase();
    }
    if (typeof o.value === 'string' && o.value.trim()) {
      return o.value.trim().toUpperCase();
    }
    if (typeof o.code === 'string' && o.code.trim()) {
      return o.code.trim().toUpperCase();
    }
  }
  return String(raw).trim().toUpperCase();
}

/**
 * 급여 계산 API 한 건에서 세전 구성 행 목록을 만든다.
 * 기본급과 상담(회기수) 급여가 동일 원단위로 중복 저장된 경우 한 줄로 합쳐 옵션 포함처럼 보이는 문제를 막는다.
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
