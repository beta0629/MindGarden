/**
 * moneyCockpitData 단위 테스트 — won format · pending 0 · axis
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildIncomeMixItems,
  buildNtsChecklistComments,
  buildOutflowMixItems,
  buildPaydayChecklistComment,
  computeSeriesMonthlyAverages,
  formatAxisTick,
  formatWonAmount,
  formatWonDisplay,
  parseFinanceDashboardPayload,
  resolveSalaryPayDayFromCodes,
  sumPendingConsultationFees,
  sumPendingSalaryNet
} from '../organisms/moneyCockpit/moneyCockpitData';
import {
  OFD_LEDGER,
  OFD_SALARY_CHECKLIST
} from '../../../constants/operatorFinanceDashboardStrings';
import { SALARY_TYPE } from '../../../constants/salaryConstants';

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

  test('sumPendingSalaryNet: PAID 상태는 합산에서 제외', () => {
    expect(sumPendingSalaryNet([
      { status: 'PAID', netSalary: 100000 },
      { status: 'PENDING', netSalary: 50000 },
      { paymentStatus: 'PAID', netSalary: 20000 }
    ])).toBe(50000);
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

  test('outflow: 카드 가맹점 수수료를 INCOME tx fee에서 mix 항목으로 표시', () => {
    const items = buildOutflowMixItems({}, [
      { type: 'INCOME', amount: 100000, cardMerchantFeeAmount: 2500 },
      { type: 'EXPENSE', category: 'RENT', amount: 50000 }
    ]);
    expect(items.find((i) => i.id === 'cardMerchantFee')).toEqual({
      id: 'cardMerchantFee',
      label: '카드 가맹점 수수료',
      amount: 2500
    });
  });

  test('미지급 급여 net은 나간 곳 mix에 넣지 않는다', () => {
    const pendingNet = sumPendingSalaryNet([
      { status: 'PENDING', netSalary: 999999 }
    ]);
    expect(pendingNet).toBe(999999);
    const items = buildOutflowMixItems({}, []);
    expect(items.find((i) => i.id === 'salary')).toBeUndefined();
    expect(items.some((i) => i.amount === pendingNet)).toBe(false);
  });

  test('income: breakdown 수입 키만', () => {
    const items = buildIncomeMixItems({ CONSULTATION: 0, SALARY: 200000 }, []);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '상담료', amount: 0 });
  });
});

describe('moneyCockpitData salary checklist helpers', () => {
  test('resolveSalaryPayDayFromCodes: isDefault 우선', () => {
    const resolved = resolveSalaryPayDayFromCodes([
      {
        codeValue: 'TENTH',
        extraData: JSON.stringify({ dayOfMonth: 10, isDefault: false })
      },
      {
        codeValue: 'TWENTY_FIFTH',
        extraData: JSON.stringify({ dayOfMonth: 25, isDefault: true })
      }
    ]);
    expect(resolved).toEqual({ codeValue: 'TWENTY_FIFTH', dayOfMonth: 25 });
  });

  test('resolveSalaryPayDayFromCodes: default 없으면 TENTH', () => {
    const resolved = resolveSalaryPayDayFromCodes([
      {
        codeValue: 'TWENTY_FIFTH',
        extraData: { dayOfMonth: 25, isDefault: false }
      },
      {
        codeValue: 'TENTH',
        extraData: { dayOfMonth: 10, isDefault: false }
      }
    ]);
    expect(resolved).toEqual({ codeValue: 'TENTH', dayOfMonth: 10 });
  });

  test('resolveSalaryPayDayFromCodes: 빈 목록 → TENTH 폴백', () => {
    expect(resolveSalaryPayDayFromCodes([])).toEqual({
      codeValue: 'TENTH',
      dayOfMonth: 10
    });
  });

  test('resolveSalaryPayDayFromCodes: LAST_DAY dayOfMonth 0', () => {
    const resolved = resolveSalaryPayDayFromCodes([
      {
        codeValue: 'LAST_DAY',
        extraData: JSON.stringify({ dayOfMonth: 0, isDefault: true })
      }
    ]);
    expect(resolved).toEqual({ codeValue: 'LAST_DAY', dayOfMonth: 0 });
  });

  test('buildPaydayChecklistComment: 미지급 + 급여일 전', () => {
    expect(buildPaydayChecklistComment({
      today: new Date(2026, 7, 5),
      dayOfMonth: 10,
      hasUnpaid: true
    })).toBe('급여일 10일 · 아직 지급 전');
  });

  test('buildPaydayChecklistComment: 미지급 + 오늘 급여일', () => {
    expect(buildPaydayChecklistComment({
      today: new Date(2026, 7, 10),
      dayOfMonth: 10,
      hasUnpaid: true
    })).toBe(OFD_SALARY_CHECKLIST.PAYDAY_TODAY);
  });

  test('buildPaydayChecklistComment: 미지급 + 급여일 지남', () => {
    expect(buildPaydayChecklistComment({
      today: new Date(2026, 7, 15),
      dayOfMonth: 10,
      hasUnpaid: true
    })).toBe(OFD_SALARY_CHECKLIST.PAYDAY_AFTER);
  });

  test('buildPaydayChecklistComment: 말일 전 코멘트', () => {
    expect(buildPaydayChecklistComment({
      today: new Date(2026, 7, 20),
      dayOfMonth: 0,
      hasUnpaid: true
    })).toBe(OFD_SALARY_CHECKLIST.PAYDAY_BEFORE_LAST_DAY);
  });

  test('buildPaydayChecklistComment: 전원 지급 시 null', () => {
    expect(buildPaydayChecklistComment({
      today: new Date(2026, 7, 5),
      dayOfMonth: 10,
      hasUnpaid: false
    })).toBeNull();
  });

  test('buildNtsChecklistComments: 프리랜서 활동 → 원천세', () => {
    const comments = buildNtsChecklistComments({
      profiles: [
        {
          consultantId: 1,
          salaryType: SALARY_TYPE.FREELANCE,
          isActive: true,
          isBusinessRegistered: true
        }
      ],
      salaryCalculations: [
        { consultantId: 1, status: 'PAID', netSalary: 100000 }
      ]
    });
    expect(comments).toContain(OFD_SALARY_CHECKLIST.NTS_WITHHOLDING);
    expect(comments).not.toContain(OFD_SALARY_CHECKLIST.BUSINESS_REG);
  });

  test('buildNtsChecklistComments: calc에 salaryType 없어도 프로필 join', () => {
    const comments = buildNtsChecklistComments({
      profiles: [
        {
          consultantId: 7,
          salaryType: SALARY_TYPE.FREELANCE,
          isActive: true,
          isBusinessRegistered: true
        }
      ],
      salaryCalculations: [
        { consultantId: 7, status: 'PENDING', netSalary: 80000 }
      ]
    });
    expect(comments).toEqual([OFD_SALARY_CHECKLIST.NTS_WITHHOLDING]);
  });

  test('buildNtsChecklistComments: 사업자 미등록 프리랜서', () => {
    const comments = buildNtsChecklistComments({
      profiles: [
        {
          consultantId: 2,
          salaryType: SALARY_TYPE.FREELANCE,
          isActive: true,
          isBusinessRegistered: false
        }
      ],
      salaryCalculations: []
    });
    expect(comments).toEqual([OFD_SALARY_CHECKLIST.BUSINESS_REG]);
  });

  test('buildNtsChecklistComments: 정규직만이면 빈 배열', () => {
    const comments = buildNtsChecklistComments({
      profiles: [
        {
          consultantId: 3,
          salaryType: SALARY_TYPE.REGULAR,
          isActive: true,
          isBusinessRegistered: false
        }
      ],
      salaryCalculations: [
        { consultantId: 3, salaryType: SALARY_TYPE.REGULAR, status: 'PENDING' }
      ]
    });
    expect(comments).toEqual([]);
  });
});

describe('moneyCockpitData parseFinanceDashboardPayload fee', () => {
  test('summary.totalCardMerchantFee 있으면 remaining에 반영(이중차감 없음)', () => {
    const parsed = parseFinanceDashboardPayload({
      summary: {
        totalRevenue: 100000,
        totalExpenses: 52500,
        totalCardMerchantFee: 2500
      },
      transactions: [
        { type: 'INCOME', amount: 100000, cardMerchantFeeAmount: 2500 },
        { type: 'EXPENSE', amount: 50000 }
      ]
    });
    expect(parsed.totalExpenses).toBe(52500);
    expect(parsed.totalCardMerchantFee).toBe(2500);
    expect(parsed.remaining).toBe(47500);
  });

  test('summary에 fee 없으면 tx 합으로 expense에 가산', () => {
    const parsed = parseFinanceDashboardPayload({
      summary: {
        totalRevenue: 100000,
        totalExpenses: 50000
      },
      transactions: [
        { type: 'INCOME', amount: 100000, cardMerchantFeeAmount: 2500 }
      ]
    });
    expect(parsed.totalCardMerchantFee).toBe(2500);
    expect(parsed.totalExpenses).toBe(52500);
    expect(parsed.remaining).toBe(47500);
  });
});
