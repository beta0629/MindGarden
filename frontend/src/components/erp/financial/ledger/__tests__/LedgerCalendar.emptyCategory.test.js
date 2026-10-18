/**
 * LedgerCalendar — 빈·null 카테고리도 '-' 표시
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LedgerCalendar, { getLedgerCurrentMonthYm } from '../LedgerCalendar';
import StandardizedApi from '../../../../../utils/standardizedApi';
import { formatLocalDateYmd } from '../../../../../utils/erpFinanceDisplay';

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

describe('LedgerCalendar 빈 카테고리', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('category 빈 문자열·null 이면 secondary 에 - 표시', async() => {
    const monthYm = getLedgerCurrentMonthYm();
    const todayYmd = formatLocalDateYmd(new Date());
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          transactionDate: `${todayYmd}T10:00:00`,
          transactionType: 'EXPENSE',
          category: '',
          description: '카테고리 없음',
          amount: 5000,
          status: 'COMPLETED'
        },
        {
          id: 2,
          transactionDate: `${todayYmd}T11:00:00`,
          transactionType: 'EXPENSE',
          category: null,
          description: '카테고리 null',
          amount: 3000,
          status: 'COMPLETED'
        }
      ],
      totalCount: 2,
      totalPages: 1,
      currentPage: 0,
      size: 20
    });

    render(
      <LedgerCalendar
        monthYm={monthYm}
        onMonthChange={() => {}}
        onView={() => {}}
      />
    );

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    const dashLabels = await screen.findAllByText('-');
    expect(dashLabels.length).toBeGreaterThanOrEqual(2);
  });
});
