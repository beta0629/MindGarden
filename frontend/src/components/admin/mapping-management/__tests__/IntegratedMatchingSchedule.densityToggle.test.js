/**
 * IntegratedMatchingSchedule — 사이드바 밀도 토글 (comfortable default, localStorage)
 *
 * @author CoreSolution
 * @since 2026-07-01
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
  useSession: () => ({ user: { id: 1, name: 'Admin', role: 'ADMIN', tenantId: 'tenant-a' } }),
  SessionContext: { Provider: ({ children }) => children }
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('@fullcalendar/interaction', () => ({
  __esModule: true,
  Draggable: class MockDraggable {
    destroy() {}
  }
}));

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

jest.mock('../../mapping/SessionExtensionModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../integrated-schedule/organisms/MappingScheduleCard', () => ({
  __esModule: true,
  default: ({ mapping }) => (
    <div data-testid={`mapping-card-${mapping.id}`}>{mapping.clientName}</div>
  )
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

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import {
  SCHEDULE_DENSITY_COMFORTABLE,
  SCHEDULE_DENSITY_COMPACT,
  buildScheduleDensityStorageKey
} from '../constants/integratedScheduleDensityConstants';

const TENANT_ID = 'tenant-a';
const STORAGE_KEY = buildScheduleDensityStorageKey(TENANT_ID);

const SAMPLE_MAPPING = {
  id: 101,
  consultantId: 11,
  clientId: 22,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  remainingSessions: 3,
  createdAt: new Date().toISOString()
};

describe('IntegratedMatchingSchedule — density toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({ mappings: [SAMPLE_MAPPING] });
  });

  const renderPage = async() => {
    render(<IntegratedMatchingSchedule />);
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
  };

  it('defaults to comfortable density without localStorage', async() => {
    await renderPage();

    const root = document.querySelector('.integrated-schedule');
    expect(root).toBeTruthy();
    expect(root.classList.contains('integrated-schedule--density-compact')).toBe(false);

    const comfortableTab = screen.getByRole('tab', { name: '표준' });
    expect(comfortableTab).toHaveAttribute('aria-selected', 'true');
  });

  it('restores compact density from tenant-scoped localStorage', async() => {
    localStorage.setItem(STORAGE_KEY, SCHEDULE_DENSITY_COMPACT);

    await renderPage();

    const root = document.querySelector('.integrated-schedule');
    expect(root.classList.contains('integrated-schedule--density-compact')).toBe(true);

    const compactTab = screen.getByRole('tab', { name: '촘촘' });
    expect(compactTab).toHaveAttribute('aria-selected', 'true');
  });

  it('persists density to localStorage when toggling to compact', async() => {
    await renderPage();

    const compactTab = screen.getByRole('tab', { name: '촘촘' });
    await act(async() => {
      fireEvent.click(compactTab);
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe(SCHEDULE_DENSITY_COMPACT);

    const root = document.querySelector('.integrated-schedule');
    expect(root.classList.contains('integrated-schedule--density-compact')).toBe(true);
  });

  it('persists density when toggling back to comfortable', async() => {
    localStorage.setItem(STORAGE_KEY, SCHEDULE_DENSITY_COMPACT);

    await renderPage();

    const comfortableTab = screen.getByRole('tab', { name: '표준' });
    await act(async() => {
      fireEvent.click(comfortableTab);
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe(SCHEDULE_DENSITY_COMFORTABLE);

    const root = document.querySelector('.integrated-schedule');
    expect(root.classList.contains('integrated-schedule--density-compact')).toBe(false);
  });
});
