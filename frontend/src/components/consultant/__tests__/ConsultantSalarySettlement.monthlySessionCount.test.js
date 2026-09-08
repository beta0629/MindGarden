/**
 * ConsultantSalarySettlement — 월 횟수 상세 표시 회귀
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultantSalarySettlement from '../ConsultantSalarySettlement';
import { CONSULTANT_SALARY_SETTLEMENT_STRINGS as S } from '../../../constants/consultantSalarySettlementStrings';
import { SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT } from '../../../constants/salaryConstants';

jest.mock('../../../hooks/useConsultantSalaryCalculations', () => ({
  useConsultantSalaryCalculations: jest.fn()
}));

const { useConsultantSalaryCalculations } = require('../../../hooks/useConsultantSalaryCalculations');

describe('ConsultantSalarySettlement monthly session count', () => {
  beforeEach(() => {
    useConsultantSalaryCalculations.mockReturnValue({
      items: [
        {
          id: 1,
          calculationPeriod: '2026-08',
          status: 'PAID',
          consultationCount: 12,
          commissionEarnings: 100000,
          baseSalary: 0,
          hourlyEarnings: 0,
          grossSalary: 100000,
          netSalary: 96700,
          taxAmount: 3300
        }
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
      hasItems: true
    });
  });

  it('shows 월 횟수 in settlement detail (not list-only)', () => {
    render(<ConsultantSalarySettlement />);
    expect(screen.getByText(S.LABEL_MONTHLY_SESSION_COUNT)).toBeInTheDocument();
    expect(
      screen.getByText(`12${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`)
    ).toBeInTheDocument();
  });
});
