/**
 * Side Peek 초기상담 결제 행 — FT 금액 표시, prepaid denorm 무시
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';

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
    <span data-testid="status-badge" data-status={status} {...rest}>{children ?? status}</span>
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

jest.mock('../integrated-schedule/molecules/SidePeekMonthlyBillingSummary', () => ({
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

describe('MappingScheduleSidePeekContent initial consultation payment', () => {
  it('shows FT amount 90,000 and ignores contract prepaid 100000', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 245,
          clientId: 78,
          clientName: '최가을',
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
          hasInstitutionLinkInitialPayment: true
        }}
      />
    );

    const row = screen.getByTestId('side-peek-initial-consultation-payment');
    expect(row).toHaveTextContent('90,000원');
    expect(row).toHaveTextContent('결제완료');
    expect(row).not.toHaveTextContent('100,000');
  });
});
