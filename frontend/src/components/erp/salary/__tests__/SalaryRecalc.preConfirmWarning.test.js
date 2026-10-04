/**
 * 급여 「다시 계산」— pre-confirm-warning 응답(extraCompletedCount · primaryStatus)으로만 노출.
 * GET 만 호출하고 확정·재계산 API 는 호출하지 않는다.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SalaryCalculationTable from '../SalaryCalculationTable';
import SalarySavedCalculationDetail from '../SalarySavedCalculationDetail';
import StandardizedApi from '../../../../utils/standardizedApi';
import { fetchSalaryLateSessionByPrimaryId } from '../../../../utils/salaryLateSessionApi';
import {
  parsePreConfirmWarningPayload,
  resolveSalaryLateSessionActions
} from '../../../../utils/salaryCalculationDisplay';
import {
  SALARY_API_ENDPOINTS,
  SALARY_CALCULATION_KIND,
  SALARY_LATE_NOTES_LABELS,
  SALARY_STATUS
} from '../../../../constants/salaryConstants';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ko' }
  })
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn()
}));

const PRIMARY_ROW = {
  id: 301,
  consultantId: 7,
  consultantName: '김상담',
  calculationPeriod: '2026-09',
  calculationPeriodStart: '2026-09-01',
  calculationPeriodEnd: '2026-09-30',
  netSalary: 1000,
  status: SALARY_STATUS.CALCULATED,
  calculationKind: SALARY_CALCULATION_KIND.PRIMARY
};

const warningResponse = (overrides = {}) => ({
  success: true,
  notCompletedCount: 0,
  missingRecordCount: 0,
  currentCompletedCount: 5,
  storedCompletedCount: 3,
  extraCompletedCount: 2,
  primaryCalculationId: PRIMARY_ROW.id,
  primaryStatus: SALARY_STATUS.CALCULATED,
  ...overrides
});

const renderTable = (row, lateSessionByPrimaryId, onRecalc = jest.fn()) => render(
  <SalaryCalculationTable
    calculations={[row]}
    consultants={[{ id: 7, name: '김상담' }]}
    lateSessionByPrimaryId={lateSessionByPrimaryId}
    formatCurrency={(n) => `${n}`}
    toSalaryNumber={(n) => Number(n) || 0}
    toSalaryStatusDisplayLabel={(s) => s}
    toSalaryStatusBadgeVariant={() => 'info'}
    onRecalc={onRecalc}
  />
);

const loadAndRenderTable = async(row, response, onRecalc) => {
  StandardizedApi.get.mockResolvedValue(response);
  const map = await fetchSalaryLateSessionByPrimaryId([row]);
  return renderTable(row, map, onRecalc);
};

describe('급여 다시 계산 — pre-confirm-warning 연동', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
  });

  test('GET pre-confirm-warning 을 consultantId · periodStart · periodEnd 로 1회 호출하고 POST 는 없다', async () => {
    StandardizedApi.get.mockResolvedValue(warningResponse());
    const map = await fetchSalaryLateSessionByPrimaryId([
      PRIMARY_ROW,
      { ...PRIMARY_ROW, id: 302 },
      { ...PRIMARY_ROW, id: 303, calculationKind: SALARY_CALCULATION_KIND.ADJUSTMENT }
    ]);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.get).toHaveBeenCalledWith(SALARY_API_ENDPOINTS.PRE_CONFIRM_WARNING, {
      consultantId: 7,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30'
    });
    expect(StandardizedApi.post).not.toHaveBeenCalled();
    expect(map[PRIMARY_ROW.id].extraCompletedCount).toBe(2);
  });

  test('extraCompletedCount 2 · 미승인(CALCULATED) → 행에 다시 계산 버튼 표시, 클릭 시 onRecalc(행, 2)', async () => {
    const onRecalc = jest.fn();
    await loadAndRenderTable(PRIMARY_ROW, warningResponse(), onRecalc);
    const button = screen.getByTestId(`salary-row-recalc-${PRIMARY_ROW.id}`);
    expect(button).toHaveTextContent(SALARY_LATE_NOTES_LABELS.RECALC);
    fireEvent.click(button);
    expect(onRecalc).toHaveBeenCalledWith(PRIMARY_ROW, 2);
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('승인완료(APPROVED)도 다시 계산 표시', async () => {
    const row = { ...PRIMARY_ROW, status: SALARY_STATUS.APPROVED };
    await loadAndRenderTable(row, warningResponse({ primaryStatus: SALARY_STATUS.APPROVED }));
    expect(screen.getByTestId(`salary-row-recalc-${row.id}`)).toBeInTheDocument();
  });

  test('extraCompletedCount 0 → 다시 계산 숨김', async () => {
    await loadAndRenderTable(PRIMARY_ROW, warningResponse({ extraCompletedCount: 0 }));
    expect(screen.queryByTestId(`salary-row-recalc-${PRIMARY_ROW.id}`)).toBeNull();
    expect(screen.queryByText(SALARY_LATE_NOTES_LABELS.RECALC)).toBeNull();
  });

  test('지급완료(PAID) → 다시 계산 숨김 (추가 정산 대상)', async () => {
    const row = { ...PRIMARY_ROW, status: SALARY_STATUS.PAID };
    await loadAndRenderTable(row, warningResponse({ primaryStatus: SALARY_STATUS.PAID }));
    expect(screen.queryByTestId(`salary-row-recalc-${row.id}`)).toBeNull();
  });

  test('응답 success:false · 조회 실패 → 다시 계산 숨김', async () => {
    const { unmount } = await loadAndRenderTable(PRIMARY_ROW, { success: false, message: 'x' });
    expect(screen.queryByTestId(`salary-row-recalc-${PRIMARY_ROW.id}`)).toBeNull();
    unmount();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    StandardizedApi.get.mockRejectedValue(new Error('network'));
    const map = await fetchSalaryLateSessionByPrimaryId([PRIMARY_ROW]);
    expect(map).toEqual({});
    errorSpy.mockRestore();
  });

  test('primaryStatus 가 PAID 면 행 status 가 CALCULATED 여도 숨김 (응답 우선)', () => {
    const lateInfo = parsePreConfirmWarningPayload(warningResponse({ primaryStatus: SALARY_STATUS.PAID }));
    expect(resolveSalaryLateSessionActions(PRIMARY_ROW, lateInfo)).toEqual({
      extraCompletedCount: 2,
      showRecalc: false,
      showAdjustment: true
    });
  });

  test('추가 정산(ADJUSTMENT) 행은 응답과 무관하게 숨김', () => {
    const lateInfo = parsePreConfirmWarningPayload(warningResponse());
    const adjustment = { ...PRIMARY_ROW, calculationKind: SALARY_CALCULATION_KIND.ADJUSTMENT };
    expect(resolveSalaryLateSessionActions(adjustment, lateInfo).showRecalc).toBe(false);
  });

  test('계산 stage 저장 행 DETAIL — 응답 기준 다시 계산 표시/숨김', () => {
    const onRecalc = jest.fn();
    const { rerender } = render(
      <SalarySavedCalculationDetail
        calculation={PRIMARY_ROW}
        lateInfo={parsePreConfirmWarningPayload({ data: warningResponse() })}
        onRecalc={onRecalc}
      />
    );
    fireEvent.click(screen.getByTestId('salary-saved-calculation-recalc'));
    expect(onRecalc).toHaveBeenCalledWith(PRIMARY_ROW, 2);

    rerender(
      <SalarySavedCalculationDetail
        calculation={PRIMARY_ROW}
        lateInfo={parsePreConfirmWarningPayload(warningResponse({ extraCompletedCount: 0 }))}
        onRecalc={onRecalc}
      />
    );
    expect(screen.queryByTestId('salary-saved-calculation-recalc')).toBeNull();
  });
});
