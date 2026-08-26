/**
 * ErpIncomeExpenseBarChartSection — empty / zero / real-data 분기
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ErpIncomeExpenseBarChartSection from '../ErpIncomeExpenseBarChartSection';

jest.mock('../../../common/MGChart', () => {
  return function MockMGChart({ data, height }) {
    return (
      <div
        data-testid="mock-mg-chart"
        data-height={height}
        data-labels={data?.labels?.join(',')}
        data-values={data?.datasets?.[0]?.data?.join(',')}
      />
    );
  };
});

jest.mock('../../../common/UnifiedLoading', () => {
  return function MockUnifiedLoading({ text }) {
    return <div data-testid="mock-unified-loading">{text}</div>;
  };
});

describe('ErpIncomeExpenseBarChartSection', () => {
  test('financialData 없으면 quiet empty 문구를 표시한다', () => {
    render(
      <ErpIncomeExpenseBarChartSection financeLoading={false} financialData={null} />
    );
    expect(
      screen.getByText('이번 달 등록된 수입·지출 거래 내역이 없습니다.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('mock-mg-chart')).not.toBeInTheDocument();
  });

  test('금액이 0이어도 차트를 표시한다', () => {
    render(
      <ErpIncomeExpenseBarChartSection
        financeLoading={false}
        financialData={{ totalIncome: 0, totalExpense: 0 }}
      />
    );
    const chart = screen.getByTestId('mock-mg-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-values', '0,0');
    expect(chart).toHaveAttribute('data-height', '240');
  });

  test('실데이터로 수입·지출 막대를 렌더한다', () => {
    render(
      <ErpIncomeExpenseBarChartSection
        financeLoading={false}
        financialData={{ totalIncome: 1200000, totalExpense: 450000 }}
      />
    );
    const chart = screen.getByTestId('mock-mg-chart');
    expect(chart).toHaveAttribute('data-labels', '수입,지출');
    expect(chart).toHaveAttribute('data-values', '1200000,450000');
  });
});
