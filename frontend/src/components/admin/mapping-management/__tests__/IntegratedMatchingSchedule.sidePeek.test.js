/**
 * IntegratedMatchingSchedule — SidePeekShell stub 연동 테스트
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';

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
    constructor() {}
    destroy() {}
  }
  return { __esModule: true, Draggable: MockDraggable };
});

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-schedule" data-region="R-MAIN" />
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
  default: () => null
}));

jest.mock('../../mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/CheckoutSameDayModal', () => ({
  __esModule: true,
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
  default: ({ children, onClick, 'aria-label': ariaLabel, disabled, 'data-testid': testId }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      data-testid={testId}
    >
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
  default: ({ mapping, onOpenPeek }) => (
    <div data-testid={`mapping-card-${mapping.id}`}>
      <button
        type="button"
        data-testid={`card-body-peek-${mapping.id}`}
        onClick={() => onOpenPeek && onOpenPeek(mapping)}
      >
        {mapping.clientName}
      </button>
      {onOpenPeek && (
        <button
          type="button"
          data-testid={`mapping-detail-peek-${mapping.id}`}
          onClick={() => onOpenPeek(mapping)}
        >
          상세
        </button>
      )}
    </div>
  )
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import { SIDE_PEEK_SHELL_REGION_PEEK } from '../../../../constants/sidePeekShellConstants';

const ACTIVE_MAPPING = {
  id: 901,
  consultantId: 11,
  clientId: 22,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  paymentTiming: 'ADVANCE',
  totalSessions: 10,
  remainingSessions: 8,
  createdAt: new Date().toISOString()
};

const renderWithMappings = async(mappings) => {
  StandardizedApi.get.mockResolvedValue({ mappings });
  const utils = render(<IntegratedMatchingSchedule />);
  await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
  return utils;
};

describe('IntegratedMatchingSchedule — SidePeekShell stub', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('카드 「상세」 클릭 → R-PEEK 패널 오픈 + stub 본문', async() => {
    await renderWithMappings([ACTIVE_MAPPING]);

    await act(async() => {
      fireEvent.click(await screen.findByTestId('mapping-detail-peek-901'));
    });

    const peekPanel = screen.getByRole('complementary', { name: '이내담 상세' });
    expect(peekPanel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(within(peekPanel).getByText('이내담')).toBeInTheDocument();
    expect(within(peekPanel).getByText('김상담')).toBeInTheDocument();
    expect(within(peekPanel).getByText(/Side Peek MVP/)).toBeInTheDocument();
    expect(screen.getByTestId('unified-schedule')).toBeInTheDocument();
  });

  test('카드 row 클릭 → peek 오픈', async() => {
    await renderWithMappings([ACTIVE_MAPPING]);

    await act(async() => {
      fireEvent.click(await screen.findByTestId('card-body-peek-901'));
    });

    expect(screen.getByRole('complementary', { name: '이내담 상세' })).toBeInTheDocument();
  });

  test('peek 닫기 → 패널 hidden', async() => {
    const { container } = await renderWithMappings([ACTIVE_MAPPING]);

    await act(async() => {
      fireEvent.click(await screen.findByTestId('mapping-detail-peek-901'));
    });

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    });

    await waitFor(() => {
      const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
      expect(panel).toHaveAttribute('hidden');
    });
  });
});
