/**
 * 대기·승인 지출만 장부에서 완료 처리할 수 있다.
 * 수입 상담료와 환불 행에는 완료 처리를 두지 않는다.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LedgerTable from '../LedgerTable';
import { canCompleteRecordedExpense } from '../../../../../utils/erpFinanceDisplay';
import { FM_ROW_ACTIONS } from '../../../../../constants/financialManagementStrings';

describe('canCompleteRecordedExpense', () => {
  test('PENDING·APPROVED 지출만 완료 처리 대상이다', () => {
    expect(canCompleteRecordedExpense({
      transactionType: 'EXPENSE',
      category: 'RENT',
      status: 'PENDING'
    })).toBe(true);
    expect(canCompleteRecordedExpense({
      transactionType: 'EXPENSE',
      category: 'SALARY',
      status: 'APPROVED'
    })).toBe(true);
    expect(canCompleteRecordedExpense({
      transactionType: 'EXPENSE',
      category: 'RENT',
      status: 'COMPLETED'
    })).toBe(false);
  });

  test('수입 상담료와 환불 지출은 완료 처리 대상이 아니다', () => {
    expect(canCompleteRecordedExpense({
      transactionType: 'INCOME',
      category: '상담료',
      description: '상담료 입금',
      status: 'PENDING'
    })).toBe(false);
    expect(canCompleteRecordedExpense({
      transactionType: 'EXPENSE',
      category: 'OTHER',
      subcategory: 'CONSULTATION_REFUND',
      description: '상담료 환불',
      status: 'PENDING'
    })).toBe(false);
  });
});

describe('LedgerTable 완료 처리 메뉴', () => {
  test('대기 지출 행의 더보기에 완료 처리가 있다', () => {
    render(<LedgerTable transactions={[{
      id: 9,
      transactionDate: '2026-10-03',
      transactionType: 'EXPENSE',
      category: 'RENT',
      description: '임대료',
      amount: 120000,
      status: 'PENDING'
    }]} />);

    fireEvent.click(screen.getByRole('button', { name: FM_ROW_ACTIONS.MORE }));
    expect(screen.getByRole('menuitem', { name: FM_ROW_ACTIONS.COMPLETE })).toBeInTheDocument();
  });

  test('수입 상담료 행에는 완료 처리가 없다', () => {
    render(<LedgerTable transactions={[{
      id: 10,
      transactionDate: '2026-10-03',
      transactionType: 'INCOME',
      category: '상담료',
      description: '상담료 입금',
      amount: 90000,
      status: 'COMPLETED'
    }]} />);

    fireEvent.click(screen.getByRole('button', { name: FM_ROW_ACTIONS.MORE }));
    expect(screen.queryByRole('menuitem', { name: FM_ROW_ACTIONS.COMPLETE })).not.toBeInTheDocument();
  });
});
