/**
 * TaxDetailsModal — ADMIN 「세금 상세」 헤더 월 횟수 표시
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import TaxDetailsModal from '../TaxDetailsModal';
import {
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL,
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT
} from '../../../constants/salaryConstants';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ success: true, data: { taxDetails: [] } }))
  }
}));

jest.mock('../modals/UnifiedModal', () => {
  return function MockUnifiedModal({ isOpen, title, children, actions }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <div>{children}</div>
        <div>{actions}</div>
      </div>
    );
  };
});

jest.mock('../MGButton', () => {
  return function MockMGButton({ children, onClick, disabled }) {
    return (
      <button type="button" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  };
});

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading'
}));

describe('TaxDetailsModal monthly session count', () => {
  it('shows 월 횟수 when calculation has consultationCount: 5', () => {
    render(
      <TaxDetailsModal
        isOpen
        onClose={() => {}}
        consultantName="홍길동"
        period="2026-08"
        calculation={{
          id: 1,
          consultationCount: 5,
          calculationPeriod: '2026-08'
        }}
      />
    );

    expect(screen.getByText(SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(`5${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId('tax-details-monthly-session-count')).toBeInTheDocument();
  });

  it('still shows 월 횟수 as 0 when count is missing', () => {
    render(
      <TaxDetailsModal
        isOpen
        onClose={() => {}}
        consultantName="김상담"
        period="2026-09"
        calculation={{ id: 2 }}
      />
    );

    expect(screen.getByText(SALARY_DETAIL_MONTHLY_SESSION_COUNT_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(`0${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`)
    ).toBeInTheDocument();
  });
});
