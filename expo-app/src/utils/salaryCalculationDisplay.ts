/**
 * ERP·상담사 급여 API 한 건에서 세전 구성 행 — 웹 `frontend/src/utils/salaryCalculationDisplay.js` 와 동일 규칙.
 *
 * @author MindGarden
 * @since 2026-05-15
 */

const LABEL_BASE = '기본 급여';
const LABEL_OPTION = '옵션 급여';
const LABEL_CONSULTATION = '상담(회기수) 급여';
const LABEL_HOURLY = '시간당 급여';
const LABEL_MERGED_DEDUP = '급여 산정액';

export const SALARY_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  CALCULATED: '계산완료',
  APPROVED: '승인완료',
  PAID: '지급완료',
  CANCELLED: '취소',
};

/**
 * API status → `SALARY_STATUS_LABELS` 키와 비교 가능한 대문자 문자열.
 */
export function normalizeSalaryCalculationStatus(raw: unknown): string {
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
        return normalizeSalaryCalculationStatus(JSON.parse(s) as unknown);
      } catch {
        return s.toUpperCase();
      }
    }
    return s.toUpperCase();
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
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

export function getSalaryStatusLabelKorean(raw: unknown, fallback: string): string {
  const key = normalizeSalaryCalculationStatus(raw);
  if (key && Object.prototype.hasOwnProperty.call(SALARY_STATUS_LABELS, key)) {
    return SALARY_STATUS_LABELS[key] ?? fallback;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return fallback;
}

export function buildSalaryCalculationComponentRows(
  calculation: Record<string, unknown> | null | undefined,
  toNum: (v: unknown) => number,
): { label: string; amount: number }[] {
  const base = toNum(calculation?.baseSalary);
  const comm = toNum(calculation?.commissionEarnings);
  const hourly = toNum(calculation?.hourlyEarnings);
  const dupBaseAndCommission = base > 0 && comm > 0 && Math.round(base) === Math.round(comm);
  if (dupBaseAndCommission) {
    return [{ label: LABEL_MERGED_DEDUP, amount: base }];
  }
  const rows: { label: string; amount: number }[] = [];
  if (base > 0) {
    rows.push({ label: LABEL_BASE, amount: base });
  }
  if (comm > 0 && hourly > 0) {
    rows.push({ label: LABEL_OPTION, amount: comm + hourly });
  } else if (comm > 0) {
    rows.push({ label: LABEL_CONSULTATION, amount: comm });
  } else if (hourly > 0) {
    rows.push({ label: LABEL_HOURLY, amount: hourly });
  }
  return rows;
}

export function mapConsultantComponentRowLabel(
  rowLabel: string,
  consultationPsychLabel: string,
): string {
  if (rowLabel === LABEL_OPTION || rowLabel === LABEL_CONSULTATION || rowLabel === LABEL_HOURLY) {
    return consultationPsychLabel;
  }
  return rowLabel;
}
