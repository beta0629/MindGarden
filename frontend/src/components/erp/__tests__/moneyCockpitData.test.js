/**
 * moneyCockpitData 단위 테스트 — won format · pending 0 · axis
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildIncomeMixItems,
  buildLateSessionTodoComments,
  buildMoneyTodoRuleComments,
  buildNtsChecklistComments,
  buildOutflowMixItems,
  buildPaydayChecklistComment,
  buildWithholdingStoredAmountComment,
  collectPrimaryPreConfirmQueries,
  computeSeriesMonthlyAverages,
  formatAxisTick,
  formatWonAmount,
  formatWonDisplay,
  mergeLateWarningsFromEntries,
  parseFinanceDashboardPayload,
  parseTaxBreakdown,
  buildStoredTaxCaption,
  parsePreConfirmWarningPayload,
  resolveSalaryPayDayFromCodes,
  sumPendingConsultationFees,
  sumPendingSalaryNet
} from '../organisms/moneyCockpit/moneyCockpitData';
import {
  OFD_HERO,
  OFD_LEDGER,
  OFD_SALARY_CHECKLIST
} from '../../../constants/operatorFinanceDashboardStrings';
import { SALARY_LATE_NOTES_LABELS, SALARY_TYPE } from '../../../constants/salaryConstants';

describe('moneyCockpitData format helpers', () => {
  test('formatWonAmount(1000000) → 1,000,000', () => {
    expect(formatWonAmount(1000000)).toBe('1,000,000');
  });

  test('formatWonDisplay(1000000) → 1,000,000원', () => {
    expect(formatWonDisplay(1000000)).toBe('1,000,000원');
  });

  test('formatWonDisplay 소수 평균도 정수 원 (예: .4원 금지)', () => {
    expect(formatWonDisplay(1234567.4)).toBe('1,234,567원');
    expect(formatWonDisplay(1234000.4)).toBe('1,234,000원');
    expect(formatWonDisplay(1234000.4)).not.toMatch(/\.\d+원/);
  });

  test('formatWonAmount는 maximumFractionDigits 0', () => {
    expect(formatWonAmount(1000000.9)).toBe('1,000,001');
    expect(formatWonAmount(1234000.4)).toBe('1,234,000');
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

  test('나눗셈 평균은 Math.round 정수 원', () => {
    const series = [
      { year: 2026, month: 4, income: 1000000, expense: 1000000 },
      { year: 2026, month: 5, income: 1000001, expense: 1000000 },
      { year: 2026, month: 6, income: 1000000, expense: 1000000 }
    ];
    const now = new Date('2026-06-15T12:00:00+09:00');
    const avg = computeSeriesMonthlyAverages(series, now);
    expect(Number.isInteger(avg.incomeAvg)).toBe(true);
    expect(Number.isInteger(avg.expenseAvg)).toBe(true);
    expect(formatWonDisplay(avg.incomeAvg)).not.toMatch(/\.\d+원/);
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

  test('sumPendingSalaryNet: 미지급 ADJUSTMENT net 포함 · PAID 제외', () => {
    expect(sumPendingSalaryNet([
      { status: 'PAID', netSalary: 500000, calculationKind: 'PRIMARY' },
      { status: 'CALCULATED', netSalary: 29100, calculationKind: 'ADJUSTMENT' },
      { status: 'APPROVED', netSalary: 1000, calculationKind: 'PRIMARY' }
    ])).toBe(30100);
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

  test('income: 카드결제+상담료 breakdown/tx 합이 한 막대', () => {
    const itemsFromBreakdown = buildIncomeMixItems(
      { 카드결제: 150000, 상담료: 270000 },
      []
    );
    expect(itemsFromBreakdown).toHaveLength(1);
    expect(itemsFromBreakdown[0]).toMatchObject({
      id: 'income-상담료',
      label: '상담료',
      amount: 420000
    });

    const itemsFromTx = buildIncomeMixItems(
      {},
      [
        { type: 'INCOME', category: '카드결제', amount: 100000 },
        { type: 'INCOME', category: '현금결제', amount: 50000 },
        { type: 'INCOME', category: '상담료', amount: 270000 },
        { type: 'INCOME', category: 'PAYMENT', amount: 30000 }
      ]
    );
    expect(itemsFromTx).toHaveLength(1);
    expect(itemsFromTx[0]).toMatchObject({
      label: '상담료',
      amount: 450000
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

  /**
   * 운영 재현: 이번 달 돈 들어온 곳 상담료 = 여러 상담료 행 합
   * (구 CONSULTATION·결제수단-as-category 누수 포함) → 420,000원
   */
  test('income: 운영 재현 — 상담료+카드결제+CONSULTATION 합 420000 (tx·breakdown·기간합 우선)', () => {
    const leakyTransactions = [
      { type: 'INCOME', category: '상담료', amount: 30000 },
      { type: 'INCOME', category: '카드결제', amount: 90000 },
      { type: 'INCOME', category: 'CONSULTATION', amount: 300000 }
    ];
    const itemsFromTx = buildIncomeMixItems({}, leakyTransactions);
    expect(itemsFromTx).toHaveLength(1);
    expect(itemsFromTx[0]).toMatchObject({ label: '상담료', amount: 420000 });

    const leakyBreakdown = { 상담료: 30000, 카드결제: 90000, CONSULTATION: 300000 };
    const itemsFromBreakdown = buildIncomeMixItems(leakyBreakdown, []);
    expect(itemsFromBreakdown).toHaveLength(1);
    expect(itemsFromBreakdown[0]).toMatchObject({ label: '상담료', amount: 420000 });

    const recentOnly = [{ type: 'INCOME', category: '상담료', amount: 30000 }];
    const itemsPeriodOverRecent = buildIncomeMixItems(
      { 상담료: 420000 },
      recentOnly
    );
    expect(itemsPeriodOverRecent).toHaveLength(1);
    expect(itemsPeriodOverRecent[0]).toMatchObject({ label: '상담료', amount: 420000 });
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

describe('moneyCockpitData money todo RULE comments', () => {
  test('parsePreConfirmWarningPayload: extraCompletedCount 정규화', () => {
    expect(parsePreConfirmWarningPayload({
      extraCompletedCount: 3,
      primaryCalculationId: 99
    })).toMatchObject({
      extraCompletedCount: 3,
      primaryCalculationId: 99
    });
    expect(parsePreConfirmWarningPayload({ success: false })).toBeNull();
  });

  test('collectPrimaryPreConfirmQueries: ADJUSTMENT 제외·중복 period 제거', () => {
    const queries = collectPrimaryPreConfirmQueries([
      {
        id: 1,
        consultantId: 5,
        calculationPeriodStart: '2026-08-01',
        calculationPeriodEnd: '2026-08-31',
        calculationKind: 'PRIMARY'
      },
      {
        id: 2,
        consultantId: 5,
        calculationPeriodStart: '2026-08-01',
        calculationPeriodEnd: '2026-08-31',
        calculationKind: 'PRIMARY'
      },
      {
        id: 3,
        consultantId: 5,
        calculationPeriodStart: '2026-08-01',
        calculationPeriodEnd: '2026-08-31',
        calculationKind: 'ADJUSTMENT',
        parentCalculationId: 1
      }
    ]);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      consultantId: 5,
      fallbackPrimaryId: 1
    });
  });

  test('mergeLateWarningsFromEntries: primaryId 맵', () => {
    expect(mergeLateWarningsFromEntries([
      [10, { extraCompletedCount: 2 }],
      null,
      [20, { extraCompletedCount: 1 }]
    ])).toEqual({
      10: { extraCompletedCount: 2 },
      20: { extraCompletedCount: 1 }
    });
  });

  test('buildWithholdingStoredAmountComment: 국세·지방세만 · 3.3% 없음', () => {
    const comment = buildWithholdingStoredAmountComment({
      WITHHOLDING_NATIONAL: 30000,
      WITHHOLDING_LOCAL: 3000,
      WITHHOLDING_TAX: 33000
    });
    expect(comment).toBe('원천징수 국세 30,000원 · 지방세 3,000원');
    expect(comment).not.toMatch(/3\.3/);
  });

  test('buildWithholdingStoredAmountComment: 0이면 null', () => {
    expect(buildWithholdingStoredAmountComment({ WITHHOLDING_NATIONAL: 0 })).toBeNull();
    expect(buildWithholdingStoredAmountComment(null)).toBeNull();
  });

  test('buildLateSessionTodoComments: 미지급 → 다시 계산', () => {
    const comments = buildLateSessionTodoComments({
      salaryCalculations: [
        {
          id: 1,
          calculationKind: 'PRIMARY',
          status: 'CALCULATED'
        }
      ],
      lateWarningsByPrimaryId: {
        1: { extraCompletedCount: 2 }
      }
    });
    expect(comments).toEqual([
      `${SALARY_LATE_NOTES_LABELS.EXTRA_COMPLETED_PREFIX} 2${SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX} · ${SALARY_LATE_NOTES_LABELS.RECALC}`
    ]);
  });

  test('buildLateSessionTodoComments: PAID + 추가정산 없음 → 추가 정산', () => {
    const comments = buildLateSessionTodoComments({
      salaryCalculations: [
        {
          id: 1,
          calculationKind: 'PRIMARY',
          status: 'PAID'
        }
      ],
      lateWarningsByPrimaryId: {
        1: { extraCompletedCount: 1 }
      }
    });
    expect(comments).toEqual([
      `${SALARY_LATE_NOTES_LABELS.EXTRA_COMPLETED_PREFIX} 1${SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX} · ${SALARY_LATE_NOTES_LABELS.ADJUSTMENT_BADGE}`
    ]);
  });

  test('buildLateSessionTodoComments: PAID + ADJUSTMENT 있으면 숨김', () => {
    const comments = buildLateSessionTodoComments({
      salaryCalculations: [
        { id: 1, calculationKind: 'PRIMARY', status: 'PAID' },
        {
          id: 2,
          calculationKind: 'ADJUSTMENT',
          parentCalculationId: 1,
          status: 'PAID'
        }
      ],
      lateWarningsByPrimaryId: {
        1: { extraCompletedCount: 1 }
      }
    });
    expect(comments).toEqual([]);
  });

  test('buildMoneyTodoRuleComments: payday + withholding + nts orchestration', () => {
    const comments = buildMoneyTodoRuleComments({
      today: new Date(2026, 7, 5),
      dayOfMonth: 10,
      hasUnpaid: true,
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
      ],
      taxByType: { WITHHOLDING_NATIONAL: 5000, WITHHOLDING_LOCAL: 500 }
    });
    expect(comments[0]).toBe('급여일 10일 · 아직 지급 전');
    expect(comments).toContain('원천징수 국세 5,000원 · 지방세 500원');
    expect(comments).toContain(OFD_SALARY_CHECKLIST.NTS_WITHHOLDING);
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

  test('incomeCategoryBreakdown 우선 — 환불 EXPENSE 상담료가 수입 mix에 섞이지 않음', () => {
    const parsed = parseFinanceDashboardPayload({
      financialData: {
        summary: { totalRevenue: 1800000, totalExpenses: 1540000, totalCardMerchantFee: 0 },
        incomeCategoryBreakdown: { 상담료: 1800000 },
        expenseCategoryBreakdown: { RENT: 1540000, 상담료: 500000 },
        categoryBreakdown: { 상담료: 1800000 },
        transactions: []
      }
    });
    expect(parsed.incomeCategoryBreakdown).toEqual({ 상담료: 1800000 });
    expect(parsed.expenseCategoryBreakdown.RENT).toBe(1540000);
    expect(parsed.expenseCategoryBreakdown['상담료']).toBe(500000);
    expect(parsed.categoryBreakdown).toEqual({ 상담료: 1800000 });
    const incomeMix = buildIncomeMixItems(parsed.incomeCategoryBreakdown, parsed.transactions);
    expect(incomeMix.find((i) => i.label && String(i.label).includes('상담'))?.amount
      || incomeMix.find((i) => i.id && i.id.includes('consultation') || i.id.includes('상담'))?.amount
      || incomeMix[0]?.amount).toBe(1800000);
  });

  test('taxBreakdown 저장 세액을 파싱하고 캡션을 만든다 (세율 재계산 없음)', () => {
    const parsed = parseFinanceDashboardPayload({
      financialData: {
        summary: { totalRevenue: 1100000, totalExpenses: 0, totalCardMerchantFee: 0 },
        taxBreakdown: {
          vatTotal: 100000,
          withholdingTotal: 33000,
          expenseVatTotal: 5000
        },
        transactions: []
      }
    });
    expect(parsed.taxBreakdown).toEqual({
      vatTotal: 100000,
      withholdingTotal: 33000,
      expenseVatTotal: 5000
    });
    expect(parseTaxBreakdown(null)).toEqual({
      vatTotal: 0,
      withholdingTotal: 0,
      expenseVatTotal: 0
    });
    const caption = buildStoredTaxCaption(parsed.taxBreakdown);
    expect(caption).toContain(OFD_HERO.TAX_VAT_PREFIX);
    expect(caption).toContain('100,000원');
    expect(caption).toContain('33,000원');
    expect(caption).toContain('5,000원');
    expect(caption).not.toMatch(/3\.3%/);
  });
});
