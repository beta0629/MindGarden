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

describe('LedgerTable 카테고리 표시', () => {
  test('categoryOptions가 있으면 label을 표시한다', () => {
    render(<LedgerTable
      transactions={[{
        id: 11,
        transactionDate: '2026-10-03',
        transactionType: 'EXPENSE',
        category: 'RENT',
        description: '사무실 임대',
        amount: 120000,
        status: 'COMPLETED'
      }]}
      categoryOptions={[{ value: 'RENT', label: '임대료' }]}
    />);

    expect(screen.getByText('임대료')).toBeInTheDocument();
  });

  test('공통코드 codeLabel이 고정 i18n/맵 라벨보다 우선한다', () => {
    render(<LedgerTable
      transactions={[{
        id: 13,
        transactionDate: '2026-10-03',
        transactionType: 'EXPENSE',
        category: 'RENT',
        description: '사무실 임대',
        amount: 120000,
        status: 'COMPLETED'
      }]}
      categoryOptions={[{ codeValue: 'RENT', codeLabel: 'API임대료라벨' }]}
    />);

    expect(screen.getByText('API임대료라벨')).toBeInTheDocument();
    expect(screen.queryByText('임대료')).not.toBeInTheDocument();
  });

  test('옵션이 없거나 미매칭이면 bare code를 표시한다', () => {
    render(<LedgerTable transactions={[{
      id: 12,
      transactionDate: '2026-10-03',
      transactionType: 'EXPENSE',
      category: 'CUSTOM_CAT',
      description: '기타 지출',
      amount: 5000,
      status: 'COMPLETED'
    }]} />);

    expect(screen.getByText('CUSTOM_CAT')).toBeInTheDocument();
  });

  test('빈·null 카테고리는 - 를 표시한다', () => {
    const { rerender } = render(<LedgerTable transactions={[{
      id: 14,
      transactionDate: '2026-10-03',
      transactionType: 'EXPENSE',
      category: '',
      description: '카테고리 없음',
      amount: 1000,
      status: 'COMPLETED'
    }]} />);

    expect(screen.getByText('-')).toBeInTheDocument();

    rerender(<LedgerTable transactions={[{
      id: 15,
      transactionDate: '2026-10-03',
      transactionType: 'EXPENSE',
      category: null,
      description: '카테고리 null',
      amount: 1000,
      status: 'COMPLETED'
    }]} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
