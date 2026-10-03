/**
 * SalarySummaryStrip — 지급 예정 / 공제 / 승인대기 값 표시
 * 부모(SalaryManagement)가 넘기는 owedTotal·deductionTotal·pendingApprovalCount 와 정합.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import SalarySummaryStrip from '../SalarySummaryStrip';
import { SM_SUMMARY } from '../../../../constants/salaryManagementClinicOsStrings';

const SEPTEMBER_OWED = 4699620;
const SEPTEMBER_DEDUCTION = 160380;
const SEPTEMBER_PENDING = 1;

describe('SalarySummaryStrip values', () => {
  test('renders owed, deduction, and pending-approval when they are not zero', () => {
    render(
      <SalarySummaryStrip
        owedTotal={SEPTEMBER_OWED}
        deductionTotal={SEPTEMBER_DEDUCTION}
        pendingApprovalCount={SEPTEMBER_PENDING}
      />
    );

    expect(screen.getByText(SM_SUMMARY.OWED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SM_SUMMARY.DEDUCTION_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SM_SUMMARY.PENDING_APPROVAL_LABEL)).toBeInTheDocument();

    expect(within(screen.getByTestId('salary-summary-owed')).getByLabelText('4,699,620원'))
      .toBeInTheDocument();
    expect(within(screen.getByTestId('salary-summary-deduction')).getByLabelText('160,380원'))
      .toBeInTheDocument();
    expect(within(screen.getByTestId('salary-summary-pending-approval')).getByLabelText('1건'))
      .toBeInTheDocument();
  });

  test('zero still renders as 0', () => {
    render(
      <SalarySummaryStrip
        owedTotal={0}
        deductionTotal={0}
        pendingApprovalCount={0}
      />
    );

    expect(within(screen.getByTestId('salary-summary-owed')).getByLabelText('0원'))
      .toBeInTheDocument();
    expect(within(screen.getByTestId('salary-summary-deduction')).getByLabelText('0원'))
      .toBeInTheDocument();
    expect(within(screen.getByTestId('salary-summary-pending-approval')).getByLabelText('0건'))
      .toBeInTheDocument();
  });

  test('does not read the retired profile/payout props', () => {
    render(
      <SalarySummaryStrip
        owedTotal={SEPTEMBER_OWED}
        deductionTotal={SEPTEMBER_DEDUCTION}
        pendingApprovalCount={SEPTEMBER_PENDING}
        profileCount={9}
        calculatedCount={8}
        payoutTotal={1}
      />
    );

    expect(screen.queryByText('9건')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('salary-summary-owed')).getByLabelText('4,699,620원'))
      .toBeInTheDocument();
  });
});
