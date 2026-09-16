/**
 * SidePeekInitialConsultationPayment — FT amount row
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SidePeekInitialConsultationPayment from '../SidePeekInitialConsultationPayment';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'admin:integratedSchedule.sidePeek.initialConsultationPaymentLabel') {
        return '초기상담 결제';
      }
      if (key === 'admin:integratedSchedule.sidePeek.initialConsultationPaymentStatusCompleted') {
        return '결제완료';
      }
      return (opts && opts.defaultValue) || key;
    }
  })
}));

jest.mock('../../../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v)),
  toSafeNumber: (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
}));

jest.mock('../../../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ children }) => <span data-testid="status-badge">{children}</span>
}));

describe('SidePeekInitialConsultationPayment', () => {
  it('renders FT 90,000 and ignores prepaid denorm 100000', () => {
    render(
      <SidePeekInitialConsultationPayment
        mapping={{
          institutionLinkPrepaidAmount: 100000,
          initialConsultationPayment: {
            financialTransactionId: 241,
            amount: 90000,
            transactionDate: '2026-09-07',
            status: 'COMPLETED'
          }
        }}
      />
    );
    const row = screen.getByTestId('side-peek-initial-consultation-payment');
    expect(row).toHaveTextContent('90,000원');
    expect(row).toHaveTextContent('결제완료');
    expect(row).not.toHaveTextContent('100,000');
  });

  it('returns null without FT payment', () => {
    const { container } = render(
      <SidePeekInitialConsultationPayment mapping={{ institutionLinkPrepaidAmount: 100000 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
