import {
  SALARY_CALC_DETAIL_BASE_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL,
  SALARY_CALC_DETAIL_OPTION_LABEL
} from '../../constants/salaryConstants';
import {
  buildSalaryCalculationComponentRows,
  normalizeSalaryCalculationStatus
} from '../salaryCalculationDisplay';

const toNum = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

describe('normalizeSalaryCalculationStatus', () => {
  it('returns uppercased string', () => {
    expect(normalizeSalaryCalculationStatus('calculated')).toBe('CALCULATED');
  });

  it('reads enum-like object name', () => {
    expect(normalizeSalaryCalculationStatus({ name: 'CALCULATED' })).toBe('CALCULATED');
  });
});

describe('buildSalaryCalculationComponentRows', () => {
  it('merges duplicate base and commission into one row', () => {
    const rows = buildSalaryCalculationComponentRows(
      { baseSalary: 120000, commissionEarnings: 120000, hourlyEarnings: 0 },
      toNum
    );
    expect(rows).toEqual([{ label: SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL, amount: 120000 }]);
  });

  it('shows consultation row when base is zero', () => {
    const rows = buildSalaryCalculationComponentRows(
      { baseSalary: 0, commissionEarnings: 120000, hourlyEarnings: 0 },
      toNum
    );
    expect(rows).toEqual([{ label: SALARY_CALC_DETAIL_CONSULTATION_LABEL, amount: 120000 }]);
  });

  it('shows base and option when both commission and hourly', () => {
    const rows = buildSalaryCalculationComponentRows(
      { baseSalary: 100000, commissionEarnings: 30000, hourlyEarnings: 20000 },
      toNum
    );
    expect(rows).toEqual([
      { label: SALARY_CALC_DETAIL_BASE_LABEL, amount: 100000 },
      { label: SALARY_CALC_DETAIL_OPTION_LABEL, amount: 50000 }
    ]);
  });
});
