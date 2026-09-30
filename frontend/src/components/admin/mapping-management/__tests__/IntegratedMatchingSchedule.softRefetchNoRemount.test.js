/**
 * 통합스케줄 soft refetch 회귀 잠금 — 하드 새로고침·폼 언마운트 없음
 *
 * - PR-865: mutation 후 loadMappings silent (로딩 오버레이·전체 리로드 없음)
 * - 95b8d5539 (PR 번호 미확인, #1283 sync 로 release/dev 반영): 같은 userId silent SET_USER 가
 *   화면을 다시 마운트하거나 목록을 다시 불러오지 않음
 *
 * 기존 IntegratedMatchingSchedule.test.js 에 없는 경로(결제 확인·배정 활성화·same-user ping)만 둔다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ mappings: [] }),
    post: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: jest.fn(),
  SessionContext: { Provider: ({ children }) => children }
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v)),
  toSafeNumber: (v, fallback = 0) => {
    if (v == null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
}));

jest.mock('@fullcalendar/interaction', () => {
  class MockDraggable {
    destroy() {}
  }
  return {
    __esModule: true,
    Draggable: MockDraggable
  };
});

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-schedule" />
}));

jest.mock('../../../schedule/ScheduleModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../MappingCreationModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/MappingPaymentModal', () => ({
  __esModule: true,
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="mapping-payment-modal">
        <button
          type="button"
          data-testid="mock-payment-confirmed"
          onClick={() => props.onPaymentConfirmed && props.onPaymentConfirmed()}
        >
          mock-payment-confirmed
        </button>
      </div>
    );
  }
}));

jest.mock('../../mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/CheckoutSameDayModal', () => ({
  __esModule: true,
  CHECKOUT_MODAL_MODE_SAME_DAY: 'same-day',
  CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE: 'confirm-activate',
  default: () => null
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ actions }) => <div data-testid="content-header">{actions}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, disabled }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-erp-class',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading...'
}));

jest.mock('../integrated-schedule/organisms/MappingScheduleCard', () => ({
  __esModule: true,
  default: ({ mapping, onPayment, onApprove }) => (
    <div data-testid={`mapping-card-${mapping.id}`}>
      <span>{mapping.clientName}</span>
      {onPayment && (
        <button
          type="button"
          data-testid={`payment-${mapping.id}`}
          onClick={() => onPayment(mapping)}
        >
          결제 확인 mock
        </button>
      )}
      {onApprove && (
        <button
          type="button"
          data-testid={`approve-${mapping.id}`}
          onClick={() => onApprove(mapping.id)}
        >
          배정 활성화 mock
        </button>
      )}
    </div>
  )
}));

jest.mock('../../mapping/SessionExtensionModal', () => ({
  __esModule: true,
  default: () => null
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import { useSession } from '../../../../contexts/SessionContext';
import { USER_ROLES } from '../../../../constants/roles';

const MAPPINGS_LOADING_TEXT = '배정 목록 불러오는 중...';

const PENDING_MAPPING = {
  id: 888,
  consultantId: 51,
  clientId: 62,
  consultantName: '정상담 선생님',
  clientName: '한내담',
  status: 'PENDING_PAYMENT',
  paymentTiming: 'ADVANCE',
  packageName: '5회기 패키지',
  packagePrice: 250000,
  totalSessions: 5,
  remainingSessions: 5,
  createdAt: new Date().toISOString()
};

const buildAdminUser = () => ({ id: 1, name: 'Admin', role: USER_ROLES.ADMIN });

const renderLoaded = async() => {
  StandardizedApi.get.mockResolvedValue({ mappings: [PENDING_MAPPING] });
  const utils = render(<IntegratedMatchingSchedule />);
  await screen.findByTestId(`mapping-card-${PENDING_MAPPING.id}`);
  await waitFor(() => {
    expect(screen.queryByText(MAPPINGS_LOADING_TEXT)).not.toBeInTheDocument();
  });
  return utils;
};

describe('IntegratedMatchingSchedule soft refetch — no hard reload / no remount', () => {
  const originalLocation = window.location;
  let reloadSpy;
  let assignSpy;

  beforeEach(() => {
    useSession.mockReturnValue({ user: buildAdminUser() });
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
    StandardizedApi.post.mockResolvedValue({});
    reloadSpy = jest.fn();
    assignSpy = jest.fn();
    delete window.location;
    window.location = {
      ...originalLocation,
      reload: reloadSpy,
      assign: assignSpy,
      replace: jest.fn()
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  test('PR-865 soft refetch — 결제 확인 후 목록만 조용히 다시 받고, 로딩 오버레이·리로드 없이 캘린더 노드 유지', async() => {
    await renderLoaded();
    const calendarNode = screen.getByTestId('unified-schedule');
    const getCallsBefore = StandardizedApi.get.mock.calls.length;

    await act(async() => {
      fireEvent.click(screen.getByTestId(`payment-${PENDING_MAPPING.id}`));
    });
    expect(await screen.findByTestId('mapping-payment-modal')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-payment-confirmed'));
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThan(getCallsBefore);
    });
    expect(screen.queryByText(MAPPINGS_LOADING_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByTestId('mapping-payment-modal')).toBeNull();
    expect(screen.getByTestId('unified-schedule')).toBe(calendarNode);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  test('PR-865 soft refetch — 배정 활성화 후 목록만 조용히 다시 받고, 로딩 오버레이·리로드 없이 캘린더 노드 유지', async() => {
    await renderLoaded();
    const calendarNode = screen.getByTestId('unified-schedule');
    const getCallsBefore = StandardizedApi.get.mock.calls.length;

    await act(async() => {
      fireEvent.click(screen.getByTestId(`approve-${PENDING_MAPPING.id}`));
    });

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        expect.stringContaining(`/${PENDING_MAPPING.id}/approve`),
        expect.any(Object)
      );
    });
    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThan(getCallsBefore);
    });
    expect(screen.queryByText(MAPPINGS_LOADING_TEXT)).not.toBeInTheDocument();
    expect(screen.getByTestId('unified-schedule')).toBe(calendarNode);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  test('95b8d5539 same-user SET_USER — 같은 userId 새 user 객체로 바뀌어도 목록 재조회·언마운트·리로드 없음', async() => {
    const { rerender } = await renderLoaded();
    const calendarNode = screen.getByTestId('unified-schedule');
    const cardNode = screen.getByTestId(`mapping-card-${PENDING_MAPPING.id}`);
    const getCallsBefore = StandardizedApi.get.mock.calls.length;

    useSession.mockReturnValue({ user: buildAdminUser() });
    await act(async() => {
      rerender(<IntegratedMatchingSchedule />);
    });

    expect(StandardizedApi.get.mock.calls.length).toBe(getCallsBefore);
    expect(screen.getByTestId('unified-schedule')).toBe(calendarNode);
    expect(screen.getByTestId(`mapping-card-${PENDING_MAPPING.id}`)).toBe(cardNode);
    expect(screen.queryByText(MAPPINGS_LOADING_TEXT)).not.toBeInTheDocument();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
