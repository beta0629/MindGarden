import {
  SALARY_CALC_DETAIL_BASE_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL,
  SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL,
  SALARY_CALC_DETAIL_OPTION_LABEL,
  SALARY_CALCULATION_KIND
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
 * API calculationKind를 PRIMARY/ADJUSTMENT 대문자로 정규화. 없으면 PRIMARY.
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeSalaryCalculationKind(raw) {
  if (raw == null || raw === '') {
    return SALARY_CALCULATION_KIND.PRIMARY;
  }
  if (typeof raw === 'object') {
    const name = raw.name ?? raw.value ?? raw.code;
    if (typeof name === 'string' && name.trim()) {
      return name.trim().toUpperCase();
    }
  }
  const s = String(raw).trim().toUpperCase();
  if (s === SALARY_CALCULATION_KIND.ADJUSTMENT) {
    return SALARY_CALCULATION_KIND.ADJUSTMENT;
  }
  return SALARY_CALCULATION_KIND.PRIMARY;
}

/**
 * @param {object} calculation
 * @returns {boolean}
 */
export function isSalaryAdjustmentCalculation(calculation) {
  return normalizeSalaryCalculationKind(calculation?.calculationKind)
    === SALARY_CALCULATION_KIND.ADJUSTMENT;
}

/**
 * PRIMARY를 앞에 두고, 같은 부모의 ADJUSTMENT를 바로 아래에 둔다.
 *
 * @param {Array<object>} list
 * @returns {Array<object>}
 */
export function orderSalaryCalculationsPrimaryThenAdjustment(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const primaries = [];
  const adjustmentsByParent = new Map();
  const orphans = [];
  list.forEach((calc) => {
    if (isSalaryAdjustmentCalculation(calc)) {
      const parentId = calc?.parentCalculationId;
      if (parentId == null) {
        orphans.push(calc);
        return;
      }
      if (!adjustmentsByParent.has(parentId)) {
        adjustmentsByParent.set(parentId, []);
      }
      adjustmentsByParent.get(parentId).push(calc);
      return;
    }
    primaries.push(calc);
  });
  const ordered = [];
  primaries.forEach((primary) => {
    ordered.push(primary);
    const children = adjustmentsByParent.get(primary.id);
    if (children) {
      ordered.push(...children);
      adjustmentsByParent.delete(primary.id);
    }
  });
  adjustmentsByParent.forEach((children) => {
    ordered.push(...children);
  });
  ordered.push(...orphans);
  return ordered;
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
