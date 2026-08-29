/**
 * moneyCockpitData 단위 테스트 — won format · pending 0 · axis
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildIncomeMixItems,
  buildOutflowMixItems,
  computeSeriesMonthlyAverages,
  formatAxisTick,
  formatWonAmount,
  formatWonDisplay,
  sumPendingConsultationFees,
  sumPendingSalaryNet
} from '../organisms/moneyCockpit/moneyCockpitData';
import { OFD_LEDGER } from '../../../constants/operatorFinanceDashboardStrings';

describe('moneyCockpitData format helpers', () => {
  test('formatWonAmount(1000000) → 1,000,000', () => {
    expect(formatWonAmount(1000000)).toBe('1,000,000');
  });

  test('formatWonDisplay(1000000) → 1,000,000원', () => {
    expect(formatWonDisplay(1000000)).toBe('1,000,000원');
  });

  test('formatWonDisplay(비숫자) → —', () => {
    expect(formatWonDisplay(null)).toBe(OFD_LEDGER.DASH);
    expect(formatWonDisplay(undefined)).toBe(OFD_LEDGER.DASH);
    expect(formatWonDisplay('abc')).toBe(OFD_LEDGER.DASH);
    expect(formatWonDisplay(NaN)).toBe(OFD_LEDGER.DASH);
  });

  test('formatAxisTick는 항상 전체 원 표기 (만/억 축약 없음)', () => {
    expect(formatAxisTick(6000000)).toBe('6,000,000원');
    expect(formatAxisTick(12000000)).toBe('12,000,000원');
    expect(formatAxisTick(0)).toBe('0원');
    expect(formatAxisTick(1200000)).toBe('1,200,000원');
    expect(String(formatAxisTick(12000000))).not.toMatch(/만/);
    expect(String(formatAxisTick(12000000))).not.toMatch(/억/);
    expect(String(formatAxisTick(12000000))).not.toMatch(/K/);
  });
});

describe('moneyCockpitData computeSeriesMonthlyAverages', () => {
  test('빈 배열 / null → 0', () => {
    expect(computeSeriesMonthlyAverages([])).toEqual({ incomeAvg: 0, expenseAvg: 0 });
    expect(computeSeriesMonthlyAverages(null)).toEqual({ incomeAvg: 0, expenseAvg: 0 });
  });

  test('운영 시작(4월)~이번 달(8월) — n=5, 선행·미래 0원 월 제외', () => {
    // 2026-01..12, 활동만 4~8월. now=2026-08 → window Apr–Aug
    const series = [
      { year: 2026, month: 1, income: 0, expense: 0 },
      { year: 2026, month: 2, income: 0, expense: 0 },
      { year: 2026, month: 3, income: 0, expense: 0 },
      { year: 2026, month: 4, income: 1000000, expense: 500000 },
      { year: 2026, month: 5, income: 2000000, expense: 1000000 },
      { year: 2026, month: 6, income: 3000000, expense: 1500000 },
      { year: 2026, month: 7, income: 4000000, expense: 2000000 },
      { year: 2026, month: 8, income: 5000000, expense: 2500000 },
      { year: 2026, month: 9, income: 0, expense: 0 },
      { year: 2026, month: 10, income: 0, expense: 0 },
      { year: 2026, month: 11, income: 0, expense: 0 },
      { year: 2026, month: 12, income: 0, expense: 0 }
    ];
    const now = new Date('2026-08-15T12:00:00+09:00');
    // sum income 15_000_000 / 5, expense 7_500_000 / 5
    expect(computeSeriesMonthlyAverages(series, now)).toEqual({
      incomeAvg: 3000000,
      expenseAvg: 1500000
    });
  });

  test('선행 0원 무시 · 현재 이후(미래) 0원 월은 n에서 제외', () => {
    const series = [
      { year: 2026, month: 1, income: 0, expense: 0 },
      { year: 2026, month: 2, income: 0, expense: 0 },
      { year: 2026, month: 3, income: 0, expense: 0 },
      { year: 2026, month: 4, income: 12000000, expense: 6000000 },
      { year: 2026, month: 5, income: 0, expense: 0 },
      { year: 2026, month: 6, income: 0, expense: 0 },
      { year: 2026, month: 7, income: 0, expense: 0 },
      { year: 2026, month: 8, income: 0, expense: 0 },
      { year: 2026, month: 9, income: 0, expense: 0 },
      { year: 2026, month: 10, income: 0, expense: 0 },
      { year: 2026, month: 11, income: 0, expense: 0 },
      { year: 2026, month: 12, income: 0, expense: 0 }
    ];
    const now = new Date('2026-08-28T00:00:00+09:00');
    // Apr..Aug = 5개월, income 12_000_000/5, expense 6_000_000/5
    expect(computeSeriesMonthlyAverages(series, now)).toEqual({
      incomeAvg: 2400000,
      expenseAvg: 1200000
    });
  });

  test('시작~지금 사이 0원 월은 분모에 포함 (Apr 데이터, May 0, Jun 데이터 → n=3)', () => {
    const series = [
      { year: 2026, month: 3, income: 0, expense: 0 },
      { year: 2026, month: 4, income: 3000000, expense: 900000 },
      { year: 2026, month: 5, income: 0, expense: 0 },
      { year: 2026, month: 6, income: 6000000, expense: 2100000 },
      { year: 2026, month: 7, income: 0, expense: 0 }
    ];
    const now = new Date('2026-06-30T23:59:59+09:00');
    expect(computeSeriesMonthlyAverages(series, now)).toEqual({
      incomeAvg: 3000000,
      expenseAvg: 1000000
    });
  });

  test('균등 값 · 12개월 모두 활동 · now=마지막 달 → 동일 평균', () => {
    const series = Array.from({ length: 12 }, (_, i) => ({
      year: 2026,
      month: i + 1,
      income: 6000000,
      expense: 3000000
    }));
    const now = new Date('2026-12-15T12:00:00+09:00');
    expect(computeSeriesMonthlyAverages(series, now)).toEqual({
      incomeAvg: 6000000,
      expenseAvg: 3000000
    });
  });

  test('활동 없으면 0', () => {
    const series = Array.from({ length: 12 }, (_, i) => ({
      year: 2026,
      month: i + 1,
      income: 0,
      expense: 0
    }));
    expect(computeSeriesMonthlyAverages(series, new Date('2026-08-01T00:00:00+09:00'))).toEqual({
      incomeAvg: 0,
      expenseAvg: 0
    });
  });
});
describe('moneyCockpitData pending sums (성공 시 0)', () => {
  test('sumPendingConsultationFees: 빈 목록 → 0 (null 아님)', () => {
    expect(sumPendingConsultationFees([])).toBe(0);
    expect(sumPendingConsultationFees({ data: [] })).toBe(0);
  });

  test('sumPendingSalaryNet: 빈 목록 → 0 (null 아님)', () => {
    expect(sumPendingSalaryNet([])).toBe(0);
  });

  test('파싱 불가 raw → null (호출부에서 행 hide)', () => {
    expect(sumPendingConsultationFees(null)).toBeNull();
    expect(sumPendingConsultationFees({ data: { notList: true } })).toBeNull();
    expect(sumPendingSalaryNet(undefined)).toBeNull();
  });
});

describe('moneyCockpitData mix builders (날조 금지 · 0원 유지)', () => {
  test('outflow: payload 키만 · 0원도 표시', () => {
    const items = buildOutflowMixItems({ SALARY: 0, RENT: 100000 }, []);
    expect(items.find((i) => i.id === 'salary')).toEqual({
      id: 'salary',
      label: '급여',
      amount: 0
    });
    expect(items.find((i) => i.id === 'rentUtility')?.amount).toBe(100000);
    expect(items.find((i) => i.id === 'refund')).toBeUndefined();
    expect(items.find((i) => i.id === 'other')).toBeUndefined();
  });

  test('income: breakdown 수입 키만', () => {
    const items = buildIncomeMixItems({ CONSULTATION: 0, SALARY: 200000 }, []);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '상담료', amount: 0 });
  });

  test('income: 한글 상담료 tx 3건 합산 (breakdown 없음)', () => {
    const transactions = [
      { type: 'INCOME', category: '상담료', amount: 30000 },
      { type: 'INCOME', category: '상담료', amount: 90000 },
      { type: 'INCOME', category: '상담료', amount: 300000 }
    ];
    const items = buildIncomeMixItems({}, transactions);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '상담료', amount: 420000 });
  });

  test('income: CONSULTATION + 한글 상담료 breakdown 병합 (canonical=상담료)', () => {
    const items = buildIncomeMixItems(
      { CONSULTATION: 100000, 상담료: 320000 },
      []
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'income-상담료',
      label: '상담료',
      amount: 420000
    });
  });

  test('income: breakdown 기간 합 우선 (최근 한 건과 무관)', () => {
    const transactions = [
      { type: 'INCOME', category: '상담료', amount: 30000 }
    ];
    const items = buildIncomeMixItems({ 상담료: 420000 }, transactions);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '상담료', amount: 420000 });
  });

  test('income: SALARY 등 지출 키는 수입 mix에 미포함', () => {
    const items = buildIncomeMixItems(
      { 상담료: 420000, SALARY: 200000, RENT: 100000 },
      []
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '상담료', amount: 420000 });
  });

  test('outflow: 급여+SALARY 병합', () => {
    const items = buildOutflowMixItems({ SALARY: 100000, 급여: 50000 }, []);
    expect(items.find((i) => i.id === 'salary')).toEqual({
      id: 'salary',
      label: '급여',
      amount: 150000
    });
  });

  test('outflow: 임대료·관리비 별칭을 임대·관리로 병합', () => {
    const items = buildOutflowMixItems(
      { 임대료: 200000, 관리비: 30000, MANAGEMENT_FEE: 20000 },
      []
    );
    expect(items.find((i) => i.id === 'rentUtility')?.amount).toBe(250000);
  });
});
