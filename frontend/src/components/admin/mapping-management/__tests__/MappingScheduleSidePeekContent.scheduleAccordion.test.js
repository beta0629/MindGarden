/**
 * MappingScheduleSidePeekContent — 일정 상세 아코디언 마운트
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => (options && options.defaultValue) || key
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

jest.mock('../../../../utils/codeHelper', () => ({
  __esModule: true,
  getMappingStatusKoreanNameSync: (status) => status || '—'
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../session-transfer-history/SessionTransferHistorySection', () => ({
  __esModule: true,
  default: () => <section data-testid="session-transfer-history" />
}));

jest.mock('../../../common/CustomSelect', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, 'data-testid': testId, ...rest }) => (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => '',
  ERP_MG_BUTTON_LOADING_TEXT: '저장 중'
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve([])),
    put: jest.fn()
  }
}));

jest.mock('../../../common/EngagementTypeBadge', () => ({
  __esModule: true,
  default: () => null
}));

describe('MappingScheduleSidePeekContent schedule accordion', () => {
  it('mounts billing schedule accordion and expands glance/list', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 501,
          clientId: 101,
          clientName: '테스트',
          consultantName: '상담사',
          status: 'ACTIVE',
          remainingSessions: 8,
          usedSessions: 2,
          totalSessions: 10,
          consultationSchedules: [
            { id: 1, date: '2026-08-15', startTime: '10:00', status: 'COMPLETED' },
            { id: 2, date: '2026-09-03', startTime: '11:00', status: 'BOOKED' }
          ]
        }}
      />
    );

    expect(screen.getByTestId('side-peek-billing-schedule-accordion')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('side-peek-billing-schedule-toggle'));
    expect(screen.getByTestId('side-peek-billing-schedule-glance')).toHaveTextContent(
      '8월 15일 · 9월 3일'
    );
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('8/15');
  });

  it('omits accordion when consultationSchedules is empty', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 502,
          clientId: 102,
          clientName: '빈일정',
          status: 'ACTIVE',
          remainingSessions: 5,
          consultationSchedules: []
        }}
      />
    );
    expect(screen.queryByTestId('side-peek-billing-schedule-accordion')).not.toBeInTheDocument();
  });

  it('IL Peek shows monthly billing union (3 schedules) while card scope stays separate', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
          clientId: 78,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          clientEngagementType: 'INSTITUTION_LINK',
          consultationSchedules: [
            { id: 436, date: '2026-09-14', startTime: '16:00', status: 'COMPLETED', sessionSequence: 1 }
          ],
          institutionLinkConsultationSchedules: [
            { id: 373, date: '2026-08-31', startTime: '14:00', status: 'COMPLETED', sessionSequence: 1 },
            { id: 378, date: '2026-09-07', startTime: '14:00', status: 'COMPLETED', sessionSequence: 1 },
            { id: 436, date: '2026-09-14', startTime: '16:00', status: 'COMPLETED', sessionSequence: 1 }
          ]
        }}
      />
    );

    expect(screen.getByTestId('side-peek-sessions-fact')).toHaveTextContent('1');
    expect(screen.getByTestId('side-peek-billing-schedule-accordion')).toHaveTextContent('월 청구 일정');
    expect(screen.getByTestId('side-peek-billing-schedule-toggle')).toHaveTextContent('일정 3건');
    fireEvent.click(screen.getByTestId('side-peek-billing-schedule-toggle'));
    expect(screen.getByTestId('side-peek-billing-schedule-glance')).toHaveTextContent(
      '8월 31일 · 9월 7일 · 14일'
    );
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('8/31');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('9/7');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('9/14');
  });

  it('shows initial payment completed badge without amount when finance flag is true', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
          clientId: 78,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          hasInstitutionLinkInitialPayment: true,
          institutionLinkPrepaidAmount: 100000,
          consultationSchedules: []
        }}
      />
    );

    const badge = screen.getByTestId('side-peek-initial-payment-completed');
    expect(badge).toHaveTextContent('admin:integratedSchedule.sidePeek.initialPaymentCompleted');
    expect(badge).not.toHaveTextContent('100000');
    expect(badge).not.toHaveTextContent('10만');
    expect(screen.queryByText(/100,?000/)).not.toBeInTheDocument();
  });

  it('hides initial payment badge when finance flag is absent even if prepaid amount exists', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
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

  it('hides initial payment UI when explicit COMBINED mode even if FT exists', () => {
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          hasInstitutionLinkInitialPayment: true,
          institutionLinkInitialBillingMode: 'COMBINED',
          initialConsultationPayment: {
            financialTransactionId: 241,
            amount: 90000,
            status: 'COMPLETED'
          },
          consultationSchedules: []
        }}
      />
    );
    expect(screen.queryByTestId('side-peek-initial-payment-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('side-peek-initial-consultation-payment')).not.toBeInTheDocument();
  });

  it('shows month-end institution billing reminder within N days of month end', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 28));
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          consultationSchedules: []
        }}
      />
    );
    expect(screen.getByTestId('side-peek-month-end-institution-billing-reminder'))
      .toHaveTextContent('admin:integratedSchedule.sidePeek.monthEndInstitutionBillingReminder');
    jest.useRealTimers();
  });

  it('hides month-end billing reminder early in the month', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 10));
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 265,
          clientName: 'IL내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          consultationSchedules: []
        }}
      />
    );
    expect(screen.queryByTestId('side-peek-month-end-institution-billing-reminder'))
      .not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('IL monthly billing summary excludes initial consultation and uses packagePrice × count', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 20));
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 901,
          clientId: 501,
          clientName: 'IL공통내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          packagePrice: 90000,
          hasInstitutionLinkInitialPayment: true,
          initialConsultationPayment: {
            financialTransactionId: 241,
            amount: 90000,
            transactionDate: '2026-09-07',
            status: 'COMPLETED'
          },
          consultationSchedules: [
            { id: 436, date: '2026-09-14', status: 'COMPLETED' }
          ],
          institutionLinkConsultationSchedules: [
            { id: 378, date: '2026-09-07', status: 'COMPLETED' },
            { id: 436, date: '2026-09-14', status: 'COMPLETED' }
          ]
        }}
      />
    );

    expect(screen.getByTestId('side-peek-monthly-billing-summary')).toBeInTheDocument();
    expect(screen.getByTestId('side-peek-monthly-billing-summary'))
      .toHaveAttribute('data-billing-composition', 'SEPARATE');
    expect(screen.getByTestId('side-peek-monthly-billing-dates')).toHaveTextContent('9/14');
    expect(screen.getByTestId('side-peek-monthly-billing-dates')).not.toHaveTextContent('9/7');
    expect(screen.getByTestId('side-peek-monthly-billing-count')).toHaveTextContent('1회');
    expect(screen.getByTestId('side-peek-monthly-billing-amount')).toHaveTextContent('90,000원');
    expect(screen.getByTestId('side-peek-initial-payment-completed'))
      .toHaveTextContent('admin:integratedSchedule.sidePeek.initialPaymentCompleted');
    expect(screen.queryByTestId('side-peek-initial-consultation-payment')).not.toBeInTheDocument();
    expect(screen.queryByText(/90,?000원/)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('COMBINED monthly billing includes all month sessions and hides initial payment UI', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 20));
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 902,
          clientId: 502,
          clientName: 'IL합산내담자',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          packagePrice: 90000,
          institutionLinkConsultationSchedules: [
            { id: 378, date: '2026-09-07', status: 'COMPLETED' },
            { id: 436, date: '2026-09-14', status: 'COMPLETED' }
          ]
        }}
      />
    );

    expect(screen.getByTestId('side-peek-monthly-billing-summary'))
      .toHaveAttribute('data-billing-composition', 'MONTHLY_COMBINED');
    expect(screen.getByTestId('side-peek-monthly-billing-dates')).toHaveTextContent('9/7');
    expect(screen.getByTestId('side-peek-monthly-billing-dates')).toHaveTextContent('9/14');
    expect(screen.getByTestId('side-peek-monthly-billing-count')).toHaveTextContent('2회');
    expect(screen.getByTestId('side-peek-monthly-billing-amount')).toHaveTextContent('180,000원');
    expect(screen.queryByTestId('side-peek-initial-payment-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('side-peek-initial-consultation-payment')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('ALL_COMBINED prefers contract monthly lump and hides initial payment UI', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 20));
    render(
      <MappingScheduleSidePeekContent
        userRole={USER_ROLES.ADMIN}
        mapping={{
          id: 903,
          clientId: 503,
          clientName: 'IL전체합산',
          consultantName: '상담사',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          packagePrice: 90000,
          institutionLinkMonthlyAmount: 500000,
          institutionLinkConsultationSchedules: [
            { id: 378, date: '2026-09-07', status: 'COMPLETED' },
            { id: 436, date: '2026-09-14', status: 'COMPLETED' }
          ]
        }}
      />
    );

    expect(screen.getByTestId('side-peek-monthly-billing-summary'))
      .toHaveAttribute('data-billing-composition', 'ALL_COMBINED');
    expect(screen.getByTestId('side-peek-monthly-billing-count')).toHaveTextContent('2회');
    expect(screen.getByTestId('side-peek-monthly-billing-amount')).toHaveTextContent('500,000원');
    expect(screen.queryByTestId('side-peek-initial-payment-completed')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
