/**
 * Side Peek 초기 결제 완료 — 심플 배지 (금액 비표시). prepaid denorm 무시.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'admin:integratedSchedule.sidePeek.initialPaymentCompleted') {
        return '초기 결제 완료';
      }
      return (opts && opts.defaultValue) || key;
    }
  })
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v)),
  toSafeNumber: (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  },
  toErrorMessage: (err, fallback) => err?.message || fallback
}));

jest.mock('../../../../utils/packagePricing', () => ({
  __esModule: true,
  parseCombinedPackageName: (name) => (name ? [String(name)] : [])
}));

jest.mock('../../../common/ActionButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ status, children, ...rest }) => (
    <span data-testid={rest['data-testid'] || 'status-badge'} data-status={status}>
      {children ?? status}
    </span>
  )
}));

jest.mock('../../../common/EngagementTypeBadge', () => ({
  __esModule: true,
  default: () => <span data-testid="engagement-badge">IL</span>
}));

jest.mock('../../../../utils/codeHelper', () => ({
  __esModule: true,
  getMappingStatusKoreanNameSync: (status) => status || '—'
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../integrated-schedule/molecules/SidePeekBillingScheduleAccordion', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../session-transfer-history/SessionTransferHistorySection', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() }
}));

describe('MappingScheduleSidePeekContent initial payment completed badge', () => {
  it('shows short completed badge without FT amount when finance exists', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 245,
          clientId: 78,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          packageName: '단회기 90,000원',
          institutionLinkPrepaidAmount: 100000,
          prepaidAmount: 100000,
          initialConsultationPayment: {
            financialTransactionId: 241,
            amount: 90000,
            transactionDate: '2026-09-07',
            status: 'COMPLETED',
            relatedMappingId: 265,
            relatedEntityType: 'INSTITUTION_LINK_PREPAID'
          },
          hasInstitutionLinkInitialPayment: true,
          consultationSchedules: []
        }}
      />
    );

    const badge = screen.getByTestId('side-peek-initial-payment-completed');
    expect(badge).toHaveTextContent('초기 결제 완료');
    expect(badge).not.toHaveTextContent('90,000');
    expect(badge).not.toHaveTextContent('100,000');
    expect(screen.queryByTestId('side-peek-initial-consultation-payment')).not.toBeInTheDocument();
    expect(screen.queryByText(/초기상담료\(선납\)/)).not.toBeInTheDocument();
  });

  it('hides badge when only contract prepaid denorm exists', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 245,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          institutionLinkPrepaidAmount: 100000,
          consultationSchedules: []
        }}
      />
    );
    expect(screen.queryByTestId('side-peek-initial-payment-completed')).not.toBeInTheDocument();
  });
});
