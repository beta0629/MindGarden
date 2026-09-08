/**
 * SalarySavedCalculationDetail — ADMIN 저장 행 DETAIL 월 횟수 표시
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SalarySavedCalculationDetail from '../SalarySavedCalculationDetail';
import {
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL,
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT
} from '../../../../constants/salaryConstants';

describe('SalarySavedCalculationDetail', () => {
  it('renders 월 횟수 and count when consultationCount is set', () => {
    render(
      <SalarySavedCalculationDetail
        calculation={{
          id: 10,
          consultantName: '홍길동',
          calculationPeriod: '2026-08',
          consultationCount: 12,
          netSalary: 96700
        }}
      />
    );

    expect(screen.getByText(SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(`12${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId('salary-saved-calculation-detail')).toBeInTheDocument();
  });

  it('falls back to completedConsultations and still shows label when count is 0', () => {
    render(
      <SalarySavedCalculationDetail
        calculation={{
          id: 11,
          completedConsultations: 0
        }}
      />
    );

    expect(screen.getByText(SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(`0${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`)
    ).toBeInTheDocument();
  });

  it('renders nothing when calculation is null', () => {
    const { container } = render(<SalarySavedCalculationDetail calculation={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
