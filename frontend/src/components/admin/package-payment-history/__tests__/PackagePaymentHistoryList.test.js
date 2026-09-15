/**
 * PackagePaymentHistoryList — 최초 배정 날짜는 배정·생성일 캡션 (최초 상담일 혼동 금지)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PackagePaymentHistoryList from '../PackagePaymentHistoryList';
import StandardizedApi from '../../../../utils/standardizedApi';
import { PACKAGE_PAYMENT_HISTORY_TYPE } from '../../../../constants/packagePaymentHistory';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

describe('PackagePaymentHistoryList date labels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('INITIAL_MAPPING shows 배정·생성일 caption and FT-aligned amount 90000', async () => {
    StandardizedApi.get.mockResolvedValue({
      summary: {
        clientName: '최가을',
        consultantName: '상담사',
        totalSessions: 1,
        remainingSessions: 0
      },
      items: [
        {
          type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
          paymentDate: '2026-09-01T19:25:12',
          packageName: '단회기 90,000원',
          sessions: 1,
          amount: 90000,
          status: 'ACTIVE',
          mappingId: 245,
          paymentReference: 'TRANSFER_20260901_192607'
        }
      ]
    });

    render(<PackagePaymentHistoryList clientId={78} />);

    await waitFor(() => {
      expect(screen.getByTestId('pkg-payment-history-date')).toBeInTheDocument();
    });

    const dateEl = screen.getByTestId('pkg-payment-history-date');
    expect(dateEl).toHaveTextContent('배정·생성일');
    expect(dateEl).not.toHaveTextContent('최초 상담일');
    expect(screen.getByText('최초 배정')).toBeInTheDocument();
    expect(screen.getByText('단회기 90,000원')).toBeInTheDocument();
    expect(screen.getByText('90,000원')).toBeInTheDocument();
    expect(screen.queryByText(/100,?000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/초기상담료/)).not.toBeInTheDocument();
  });
});
