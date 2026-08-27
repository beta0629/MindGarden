/**
 * moneyCockpitData 단위 테스트 — won format · pending 0 · axis
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildIncomeMixItems,
  buildOutflowMixItems,
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

  test('formatAxisTick에 원이 포함된다', () => {
    expect(formatAxisTick(1200000)).toBe('1,200,000원');
    expect(String(formatAxisTick(12000000))).toMatch(/원/);
    expect(String(formatAxisTick(12000000))).not.toMatch(/K/);
    expect(String(formatAxisTick(1200000))).not.toBe('120만');
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
});
