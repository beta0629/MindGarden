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
  useSession: jest.fn(() => ({ user: { id: 1, name: 'Admin', role: 'ADMIN' } })),
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
  default: (props) => {
    global.__integratedScheduleUnifiedProps = props;
    return <div data-testid="unified-schedule" />;
  }
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
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="mapping-creation-modal">
        <button
          type="button"
          data-testid="mock-mapping-created"
          onClick={() => props.onMappingCreated && props.onMappingCreated({})}
        >
          mock-mapping-created
        </button>
      </div>
    );
  }
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
  default: (props) => {
    if (!props.isOpen) return null;
    return (
      <div
        data-testid="checkout-same-day-modal"
        data-mapping-id={props.mapping?.id ?? ''}
        data-payment-timing={props.mapping?.paymentTiming ?? ''}
        data-mode={props.mode ?? ''}
      >
        <button
          type="button"
          data-testid="mock-checkout-same-day-completed"
          onClick={() => props.onCheckoutCompleted && props.onCheckoutCompleted()}
        >
          mock-checkout-completed
        </button>
      </div>
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
import { useSession } from '../../../../contexts/SessionContext';
import { USER_ROLES } from '../../../../constants/roles';
import { EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE, EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS } from '../../../../utils/scheduleExternalDropGuards';

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
    useSession.mockReturnValue({ user: { id: 1, name: 'Admin', role: USER_ROLES.ADMIN } });
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
    StandardizedApi.post.mockResolvedValue({});
    notificationManager.success.mockClear();
    notificationManager.error.mockClear();
    notificationManager.warning.mockClear();
    notificationManager.info.mockClear();
  });

  // 매트릭스 §5 케이스 37 + 38
  test('SAME_DAY_CARD 배정 일정 등록 직후 → CheckoutSameDayModal 자동 오픈 0 + 토스트 안내 노출', async() => {
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

  /**
   * 제품 정책 — provisional rem=0 + 점유 일정 → ScheduleModal 오픈 허용(복수 일정·월말 결제).
   */
  test('SSOT: provisional rem=0 + occupying → ScheduleModal opens (multi-schedule allowed)', async() => {
    const occupiedProvisional = {
      ...SAME_DAY_CARD_MAPPING,
      id: 901,
      remainingSessions: 0,
      hasConsultationSchedule: true
    };
    await renderWithMappings([occupiedProvisional]);

    const scheduleBtn = await screen.findByTestId('schedule-from-card-901');
    await act(async() => {
      fireEvent.click(scheduleBtn);
    });

    expect(await screen.findByTestId('schedule-modal-mock')).toBeInTheDocument();
    expect(notificationManager.warning).not.toHaveBeenCalledWith(
      EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
      EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
    );
  });

  /**
   * onDropFromExternal 도 동일: 점유 있어도 ScheduleModal 오픈.
   */
  test('SSOT: onDropFromExternal provisional rem=0 + occupying → ScheduleModal opens', async() => {
    await renderWithMappings([SAME_DAY_CARD_MAPPING]);

    await waitFor(() => {
      expect(typeof global.__integratedScheduleUnifiedProps?.onDropFromExternal).toBe('function');
    });

    await act(async() => {
      global.__integratedScheduleUnifiedProps.onDropFromExternal(new Date(), {
        mappingId: SAME_DAY_CARD_MAPPING.id,
        consultantId: SAME_DAY_CARD_MAPPING.consultantId,
        clientId: SAME_DAY_CARD_MAPPING.clientId,
        consultantName: SAME_DAY_CARD_MAPPING.consultantName,
        clientName: SAME_DAY_CARD_MAPPING.clientName,
        status: SAME_DAY_CARD_MAPPING.status,
        remainingSessions: 0,
        paymentTiming: 'SAME_DAY_CARD',
        hasConsultationSchedule: true
      });
    });

    expect(await screen.findByTestId('schedule-modal-mock')).toBeInTheDocument();
    expect(notificationManager.warning).not.toHaveBeenCalledWith(
      '이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.',
      EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
    );
  });

  /**
   * API hasConsultationSchedule=false + 캘린더 COMPLETED 점유여도 모달 오픈.
   * 과거 날짜면 past_date 가드로 차단될 수 있으므로 미래/오늘 날짜 사용.
   */
  test('SSOT: rem=0 + calendar COMPLETED (API flag false) → ScheduleModal opens', async() => {
    const occupied = {
      ...SAME_DAY_CARD_MAPPING,
      id: 902,
      remainingSessions: 0,
      hasConsultationSchedule: false
    };
    await renderWithMappings([occupied]);

    await waitFor(() => {
      expect(typeof global.__integratedScheduleUnifiedProps?.onScheduleEventsChange).toBe('function');
      expect(typeof global.__integratedScheduleUnifiedProps?.onDropFromExternal).toBe('function');
    });

    await act(async() => {
      global.__integratedScheduleUnifiedProps.onScheduleEventsChange([
        {
          id: 4401,
          extendedProps: {
            mappingId: 902,
            consultantId: occupied.consultantId,
            clientId: occupied.clientId,
            status: 'COMPLETED',
            type: 'CONSULTATION'
          }
        }
      ]);
    });

    const dropDate = new Date();
    dropDate.setDate(dropDate.getDate() + 1);

    await act(async() => {
      global.__integratedScheduleUnifiedProps.onDropFromExternal(dropDate, {
        mappingId: 902,
        consultantId: occupied.consultantId,
        clientId: occupied.clientId,
        consultantName: occupied.consultantName,
        clientName: occupied.clientName,
        status: occupied.status,
        remainingSessions: 0,
        paymentTiming: 'SAME_DAY_CARD',
        hasConsultationSchedule: false
      });
    });

    expect(await screen.findByTestId('schedule-modal-mock')).toBeInTheDocument();
    expect(notificationManager.warning).not.toHaveBeenCalledWith(
      EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
      EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
    );
  });

  // 매트릭스 §5 케이스 37 회귀 가드 — ADVANCE 매칭은 안내 토스트 미노출
  test('ADVANCE 배정 일정 등록 직후 → CheckoutSameDayModal 자동 오픈 0 + SAME_DAY_CARD 토스트 미노출', async() => {
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
    // paymentTiming 누락 시 confirm-activate 로 잘못 분기하는 회귀 가드
    expect(modal.getAttribute('data-payment-timing')).toBe('SAME_DAY_CARD');
    expect(modal.getAttribute('data-mode')).toBe('same-day');
    expect(notificationManager.warning).not.toHaveBeenCalled();
  });

  test('ADVANCE PENDING_PAYMENT 카드 결제 CTA → confirm-activate mode', async() => {
    const advancePending = {
      ...SAME_DAY_CARD_MAPPING,
      id: 556,
      paymentTiming: 'ADVANCE',
      status: 'PENDING_PAYMENT'
    };
    await renderWithMappings([advancePending]);

    const checkoutBtn = await screen.findByTestId('checkout-same-day-556');
    await act(async() => {
      fireEvent.click(checkoutBtn);
    });

    const modal = await screen.findByTestId('checkout-same-day-modal');
    expect(modal.getAttribute('data-payment-timing')).toBe('ADVANCE');
    expect(modal.getAttribute('data-mode')).toBe('confirm-activate');
  });

  test('ACTIVE 배정 — 카드 회기 추가 → SessionExtensionModal 오픈', async() => {
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

describe('IntegratedMatchingSchedule — schedule save silent refresh', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ user: { id: 1, name: 'Admin', role: USER_ROLES.ADMIN } });
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
    StandardizedApi.post.mockResolvedValue({});
    global.__integratedScheduleUnifiedProps = null;
  });

  test('UnifiedScheduleComponent receives silentScheduleRefetch', async() => {
    await renderWithMappings([ADVANCE_ACTIVE_MAPPING]);
    expect(global.__integratedScheduleUnifiedProps?.silentScheduleRefetch).toBe(true);
  });

  test('schedule created does not show sidebar loading overlay during mapping refresh', async() => {
    await renderWithMappings([ADVANCE_ACTIVE_MAPPING]);

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    const scheduleBtn = await screen.findByTestId('schedule-from-card-777');
    await act(async() => {
      fireEvent.click(scheduleBtn);
    });

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-create-schedule'));
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThan(1);
    });

    expect(screen.queryByText('배정 목록 불러오는 중...')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });

  test('checkout same-day completed does not show sidebar loading overlay', async() => {
    await renderWithMappings([SAME_DAY_CARD_MAPPING]);

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    const initialRefetchTrigger = global.__integratedScheduleUnifiedProps?.refetchTrigger ?? 0;
    const getCallCountBefore = StandardizedApi.get.mock.calls.length;

    const checkoutBtn = await screen.findByTestId('checkout-same-day-555');
    await act(async() => {
      fireEvent.click(checkoutBtn);
    });

    expect(await screen.findByTestId('checkout-same-day-modal')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-checkout-same-day-completed'));
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThan(getCallCountBefore);
    });

    expect(screen.queryByText('배정 목록 불러오는 중...')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checkout-same-day-modal')).toBeNull();
    expect(global.__integratedScheduleUnifiedProps?.refetchTrigger).toBe(initialRefetchTrigger + 1);
  });

  test('mapping created does not show sidebar loading overlay during mapping refresh', async() => {
    await renderWithMappings([ADVANCE_ACTIVE_MAPPING]);

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    const getCallCountBefore = StandardizedApi.get.mock.calls.length;

    await act(async() => {
      fireEvent.click(screen.getByLabelText('신규 배정 생성'));
    });

    expect(await screen.findByTestId('mapping-creation-modal')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('mock-mapping-created'));
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThan(getCallCountBefore);
    });

    expect(screen.queryByText('배정 목록 불러오는 중...')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });
});

describe('IntegratedMatchingSchedule — 신규 배정 CTA role gate', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.post.mockReset();
    StandardizedApi.post.mockResolvedValue({});
  });

  test('신규 배정 CTA is visible for ADMIN', async() => {
    useSession.mockReturnValue({ user: { id: 1, name: 'Admin', role: USER_ROLES.ADMIN } });
    await renderWithMappings([]);
    expect(screen.getByLabelText('신규 배정 생성')).toBeInTheDocument();
    expect(screen.getByText('신규 배정')).toBeInTheDocument();
  });

  test('신규 배정 CTA is visible for STAFF', async() => {
    useSession.mockReturnValue({ user: { id: 2, name: 'Staff', role: USER_ROLES.STAFF } });
    await renderWithMappings([]);
    expect(screen.getByLabelText('신규 배정 생성')).toBeInTheDocument();
  });

  test('신규 배정 CTA is hidden for CONSULTANT (fail-closed)', async() => {
    useSession.mockReturnValue({ user: { id: 3, name: 'Consultant', role: USER_ROLES.CONSULTANT } });
    await renderWithMappings([]);
    expect(screen.queryByLabelText('신규 배정 생성')).not.toBeInTheDocument();
    expect(screen.queryByText('신규 배정')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mapping-creation-modal')).not.toBeInTheDocument();
  });

  test('신규 배정 CTA is hidden when role is missing (fail-closed)', async() => {
    useSession.mockReturnValue({ user: { id: 4, name: 'NoRole' } });
    await renderWithMappings([]);
    expect(screen.queryByLabelText('신규 배정 생성')).not.toBeInTheDocument();
  });
});
