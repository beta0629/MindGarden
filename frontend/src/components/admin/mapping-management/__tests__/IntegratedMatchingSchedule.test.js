/**
 * IntegratedMatchingSchedule — 옵션 B v2.0 Path 3 UX 핫픽스 RTL 회귀 가드.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md §2·§3·§7.3
 * 매트릭스: docs/project-management/2026-05-28/OPTION_B_V2_TEST_MATRIX.md §5 (케이스 37·38·40)
 *
 * 사용자 결재 14:48 KST (v2.0 합의서 default 권장안):
 *  - Q3: 결제 모달 자동 오픈 제거 후 추가 진입 경로 없음 — 사이드바 "당일 결제 + 활성화" 만.
 *
 * 검증:
 *  - handleScheduleCreated 후 CheckoutSameDayModal 자동 오픈 0 (paymentTiming=SAME_DAY_CARD)
 *  - 토스트 안내(admin:integratedSchedule.tentativeReserved.info) 노출
 *  - 사이드바 카드 "당일 결제 + 활성화" 버튼 진입은 CheckoutSameDayModal 정상 오픈 (회귀 0)
 *
 * @author MindGarden
 * @since 2026-05-28
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
  useSession: () => ({ user: { id: 1, name: 'Admin', role: 'ADMIN' } }),
  SessionContext: { Provider: ({ children }) => children }
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('@fullcalendar/interaction', () => {
  class MockDraggable {
    constructor() {
      // FullCalendar Draggable mock — DOM 이벤트 바인딩은 RTL 범위 밖이므로 no-op
    }
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
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="schedule-modal-mock">
        <button
          type="button"
          data-testid="mock-create-schedule"
          onClick={() => props.onScheduleCreated && props.onScheduleCreated({ id: 9876 })}
        >
          mock-create-schedule
        </button>
        <button type="button" data-testid="mock-close-schedule" onClick={props.onClose}>
          mock-close-schedule
        </button>
      </div>
    );
  }
}));

jest.mock('../../MappingCreationModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/MappingPaymentModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/CheckoutSameDayModal', () => ({
  __esModule: true,
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div
        data-testid="checkout-same-day-modal"
        data-mapping-id={props.mapping?.id ?? ''}
      />
    );
  }
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
  default: ({ mapping, onScheduleFromCard, onCheckoutSameDay, onSessionExtension }) => (
    <div data-testid={`mapping-card-${mapping.id}`}>
      <span>{mapping.clientName}</span>
      {onScheduleFromCard && (
        <button
          type="button"
          data-testid={`schedule-from-card-${mapping.id}`}
          onClick={() => onScheduleFromCard(mapping)}
        >
          일정 등록 mock
        </button>
      )}
      {onCheckoutSameDay && (
        <button
          type="button"
          data-testid={`checkout-same-day-${mapping.id}`}
          onClick={() => onCheckoutSameDay(mapping)}
        >
          당일 결제 + 활성화 mock
        </button>
      )}
      {onSessionExtension && mapping.status === 'ACTIVE' && (
        <button
          type="button"
          data-testid={`session-extension-${mapping.id}`}
          onClick={() => onSessionExtension(mapping)}
        >
          회기 추가 mock
        </button>
      )}
    </div>
  )
}));

jest.mock('../../mapping/SessionExtensionModal', () => ({
  __esModule: true,
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div
        data-testid="session-extension-modal"
        data-mapping-id={props.mapping?.id ?? ''}
      />
    );
  }
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const SAME_DAY_CARD_MAPPING = {
  id: 555,
  consultantId: 11,
  clientId: 22,
  consultantName: '김선희 선생님',
  clientName: '이재학',
  status: 'PENDING_PAYMENT',
  paymentTiming: 'SAME_DAY_CARD',
  packageName: '10회기 패키지',
  packagePrice: 500000,
  totalSessions: 10,
  remainingSessions: 0,
  createdAt: new Date().toISOString()
};

// ACTIVE + ADVANCE — 회기 잔존이 있어 사이드바 일정 등록 버튼이 노출되는 일반 흐름.
const ADVANCE_ACTIVE_MAPPING = {
  id: 777,
  consultantId: 31,
  clientId: 42,
  consultantName: '박상담 선생님',
  clientName: '최내담',
  status: 'ACTIVE',
  paymentTiming: 'ADVANCE',
  packageName: '5회기 패키지',
  packagePrice: 250000,
  totalSessions: 5,
  remainingSessions: 5,
  createdAt: new Date().toISOString()
};

const renderWithMappings = async(mappings) => {
  StandardizedApi.get.mockResolvedValue({ mappings });
  const utils = render(<IntegratedMatchingSchedule />);
  await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
  return utils;
};

describe('IntegratedMatchingSchedule — v2.0 Path 3 UX 핫픽스', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
    StandardizedApi.post.mockResolvedValue({});
    notificationManager.success.mockClear();
    notificationManager.error.mockClear();
    notificationManager.warning.mockClear();
    notificationManager.info.mockClear();
  });

  // 매트릭스 §5 케이스 37 + 38
  test('SAME_DAY_CARD 매칭 일정 등록 직후 → CheckoutSameDayModal 자동 오픈 0 + 토스트 안내 노출', async() => {
    await renderWithMappings([SAME_DAY_CARD_MAPPING]);

    const scheduleBtn = await screen.findByTestId('schedule-from-card-555');
    await act(async() => {
      fireEvent.click(scheduleBtn);
    });

    expect(await screen.findByTestId('schedule-modal-mock')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-create-schedule'));
    });

    // v2.0 Path 3: 결제 모달 자동 진입 영구 제거
    await waitFor(() => {
      expect(screen.queryByTestId('schedule-modal-mock')).toBeNull();
    });
    expect(screen.queryByTestId('checkout-same-day-modal')).toBeNull();

    // SAME_DAY_CARD 토스트 안내 (i18n key 기반 — useTranslation mock 이 key 그대로 반환)
    expect(notificationManager.info).toHaveBeenCalledWith(
      'admin:integratedSchedule.tentativeReserved.info'
    );
  });

  // 매트릭스 §5 케이스 37 회귀 가드 — ADVANCE 매칭은 안내 토스트 미노출
  test('ADVANCE 매칭 일정 등록 직후 → CheckoutSameDayModal 자동 오픈 0 + SAME_DAY_CARD 토스트 미노출', async() => {
    await renderWithMappings([ADVANCE_ACTIVE_MAPPING]);

    const scheduleBtn = await screen.findByTestId('schedule-from-card-777');
    await act(async() => {
      fireEvent.click(scheduleBtn);
    });

    expect(await screen.findByTestId('schedule-modal-mock')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-create-schedule'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('schedule-modal-mock')).toBeNull();
    });
    expect(screen.queryByTestId('checkout-same-day-modal')).toBeNull();

    expect(notificationManager.info).not.toHaveBeenCalledWith(
      'admin:integratedSchedule.tentativeReserved.info'
    );
  });

  // 매트릭스 §5 케이스 40 — 사이드바 카드 "당일 결제 + 활성화" 버튼 진입 회귀 0
  test('사이드바 카드 "당일 결제 + 활성화" 버튼 클릭 → CheckoutSameDayModal 정상 오픈', async() => {
    await renderWithMappings([SAME_DAY_CARD_MAPPING]);

    const checkoutBtn = await screen.findByTestId('checkout-same-day-555');
    await act(async() => {
      fireEvent.click(checkoutBtn);
    });

    const modal = await screen.findByTestId('checkout-same-day-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.getAttribute('data-mapping-id')).toBe('555');
    expect(notificationManager.warning).not.toHaveBeenCalled();
  });

  test('ACTIVE 매칭 — 카드 회기 추가 → SessionExtensionModal 오픈', async() => {
    await renderWithMappings([ADVANCE_ACTIVE_MAPPING]);

    const cardButton = await screen.findByTestId('session-extension-777');
    await act(async() => {
      fireEvent.click(cardButton);
    });

    const modal = await screen.findByTestId('session-extension-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.getAttribute('data-mapping-id')).toBe('777');
  });
});
