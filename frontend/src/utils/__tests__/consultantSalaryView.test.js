/**
 * consultantSalaryView — 상담사 급여 정산(읽기 전용) 계산·분류·요약
 */
import {
  buildSalarySummary,
  classifySalaryPayout,
  computeSalaryCardAmounts,
  filterSalaryItems,
  resolveSalaryPeriodRange,
  resolveSalaryYearMonth,
  sortSalaryItemsNewestFirst,
  toSalaryNumber
} from '../consultantSalaryView';
import { CONSULTANT_SALARY_FILTER } from '../../constants/consultantSuite';

const paidAug = {
  id: 1,
  calculationPeriod: '2026-08',
  calculationPeriodEnd: '2026-08-31',
  status: 'PAID',
  consultationCount: 12,
  commissionEarnings: 1200000,
  bonusEarnings: 40000,
  grossSalary: 1240000,
  taxAmount: 147840,
  netSalary: 1092160
};

const approvedSep = {
  id: 2,
  calculationPeriod: '2026-09',
  calculationPeriodEnd: '2026-09-30',
  status: 'APPROVED',
  consultationCount: 10,
  commissionEarnings: 1000000,
  grossSalary: 1000000,
  taxAmount: 33000,
  netSalary: 967000
};

const cancelledOct = {
  id: 3,
  calculationPeriod: '2026-10',
  calculationPeriodEnd: '2026-10-31',
  status: 'CANCELLED',
  grossSalary: 500000,
  netSalary: 480000
};

describe('consultantSalaryView', () => {
  it('toSalaryNumber: null·빈값·NaN 은 0', () => {
    expect(toSalaryNumber(null)).toBe(0);
    expect(toSalaryNumber('')).toBe(0);
    expect(toSalaryNumber('abc')).toBe(0);
    expect(toSalaryNumber('1200')).toBe(1200);
  });

  it('classifySalaryPayout: PAID=paid, CANCELLED=cancelled, 그 외=pending', () => {
    expect(classifySalaryPayout(paidAug)).toBe(CONSULTANT_SALARY_FILTER.PAID);
    expect(classifySalaryPayout(approvedSep)).toBe(CONSULTANT_SALARY_FILTER.PENDING);
    expect(classifySalaryPayout({ status: 'CALCULATED' })).toBe(CONSULTANT_SALARY_FILTER.PENDING);
    expect(classifySalaryPayout(cancelledOct)).toBe('cancelled');
  });

  it('resolveSalaryYearMonth / resolveSalaryPeriodRange', () => {
    expect(resolveSalaryYearMonth({ calculationPeriod: '2026-08' })).toEqual({ year: 2026, month: 8 });
    expect(resolveSalaryYearMonth({ year: 2026, month: 3 })).toEqual({ year: 2026, month: 3 });
    expect(resolveSalaryYearMonth({ calculationPeriod: 'bad' })).toBeNull();
    expect(resolveSalaryPeriodRange({
      calculationPeriodStart: '2026-08-01T00:00:00',
      calculationPeriodEnd: '2026-08-31T23:59:59'
    })).toEqual({ start: '2026-08-01', end: '2026-08-31' });
    expect(resolveSalaryPeriodRange({ calculationPeriodStart: '2026-08-01' })).toBeNull();
  });

  it('computeSalaryCardAmounts: 수당·공제·실수령은 응답값 우선', () => {
    const amounts = computeSalaryCardAmounts(paidAug);
    expect(amounts.sessionCount).toBe(12);
    expect(amounts.bonus).toBe(40000);
    expect(amounts.grossPretax).toBe(1240000);
    expect(amounts.tax).toBe(147840);
    expect(amounts.net).toBe(1092160);
  });

  it('computeSalaryCardAmounts: netSalary 가 없으면 세전 − 공제', () => {
    const amounts = computeSalaryCardAmounts({ grossSalary: 100000, taxAmount: 3300 });
    expect(amounts.net).toBe(96700);
  });

  it('sortSalaryItemsNewestFirst · filterSalaryItems', () => {
    const items = [paidAug, cancelledOct, approvedSep];
    expect(sortSalaryItemsNewestFirst(items).map((i) => i.id)).toEqual([3, 2, 1]);
    expect(filterSalaryItems(items, CONSULTANT_SALARY_FILTER.ALL).map((i) => i.id)).toEqual([3, 2, 1]);
    expect(filterSalaryItems(items, CONSULTANT_SALARY_FILTER.PAID).map((i) => i.id)).toEqual([1]);
    expect(filterSalaryItems(items, CONSULTANT_SALARY_FILTER.PENDING).map((i) => i.id)).toEqual([2]);
    expect(sortSalaryItemsNewestFirst(null)).toEqual([]);
  });

  it('buildSalarySummary: 취소 건은 최근 실수령·건수에서 제외', () => {
    expect(buildSalarySummary([paidAug, cancelledOct, approvedSep])).toEqual({
      latestNet: 967000,
      pendingCount: 1,
      paidCount: 1
    });
    expect(buildSalarySummary([])).toEqual({ latestNet: null, pendingCount: 0, paidCount: 0 });
    expect(buildSalarySummary([cancelledOct])).toEqual({ latestNet: null, pendingCount: 0, paidCount: 0 });
  });
});
