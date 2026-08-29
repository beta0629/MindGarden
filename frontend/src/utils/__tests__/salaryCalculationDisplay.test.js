import {
  SALARY_CALC_DETAIL_BASE_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL,
  SALARY_CALC_DETAIL_OPTION_LABEL,
  SALARY_CALCULATION_KIND,
  SALARY_LATE_NOTES_LABELS,
  SALARY_LATE_NOTES_MESSAGES
} from '../../constants/salaryConstants';
import {
  buildSalaryCalculationComponentRows,
  isSalaryAdjustmentCalculation,
  normalizeSalaryCalculationKind,
  normalizeSalaryCalculationStatus,
  orderSalaryCalculationsPrimaryThenAdjustment,
  toSalaryLateNotesErrorMessage
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

describe('normalizeSalaryCalculationKind / order', () => {
  it('defaults missing kind to PRIMARY', () => {
    expect(normalizeSalaryCalculationKind(null)).toBe(SALARY_CALCULATION_KIND.PRIMARY);
  });

  it('detects ADJUSTMENT and orders under parent', () => {
    const primary = { id: 1, calculationKind: 'PRIMARY' };
    const adj = { id: 2, calculationKind: 'ADJUSTMENT', parentCalculationId: 1 };
    const other = { id: 3, calculationKind: 'PRIMARY' };
    expect(isSalaryAdjustmentCalculation(adj)).toBe(true);
    expect(orderSalaryCalculationsPrimaryThenAdjustment([adj, other, primary])).toEqual([
      other,
      primary,
      adj
    ]);
  });
});

describe('toSalaryLateNotesErrorMessage', () => {
  it('replaces English ADJUSTMENT/PRIMARY jargon with Korean labels', () => {
    expect(
      toSalaryLateNotesErrorMessage(
        '추가 정산(ADJUSTMENT) 행은 재계산할 수 없습니다.',
        SALARY_LATE_NOTES_MESSAGES.RECALC_ERROR
      )
    ).toBe(`추가 정산(${SALARY_LATE_NOTES_LABELS.ADJUSTMENT_BADGE}) 행은 재계산할 수 없습니다.`);
    expect(
      toSalaryLateNotesErrorMessage(
        '추가 정산은 지급완료 PRIMARY 급여에만 가능합니다.',
        SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_ERROR
      )
    ).toBe('추가 정산은 지급완료 본정산 급여에만 가능합니다.');
  });

  it('falls back when message is empty', () => {
    expect(
      toSalaryLateNotesErrorMessage(null, SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_ERROR)
    ).toBe(SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_ERROR);
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
